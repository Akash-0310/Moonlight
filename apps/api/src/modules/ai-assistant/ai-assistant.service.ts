import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ChatProduct, ChatResponse } from './dto/chat.dto';

const CHAT_TTL      = 30 * 60;
const MAX_TURNS     = 20;
const MAX_TOOL_ITER = 5;   // guard against infinite tool-call loops
const MODEL         = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are Luna, MoonLight's AI shopping assistant. MoonLight is a premium Indian fashion e-commerce store.

STORE OVERVIEW:
- Fashion for Men, Women, and Kids
- Categories: Topwear (shirts, t-shirts, kurtas), Bottomwear (jeans, trousers, leggings), Winterwear (jackets, sweaters, hoodies)
- All prices in Indian Rupees (₹)
- Free delivery above ₹999, flat ₹10 below that
- 7-day returns on unused items in original packaging
- Payment: Cash on Delivery (COD), Stripe (cards), Razorpay (UPI, Net Banking, Cards)

CRITICAL RULES:
1. ALWAYS call search_products when user mentions clothing, outfits, style, or asks for recommendations
2. Keep text responses CONCISE — 2-3 sentences max
3. Never fabricate product names, prices, or availability — only use tool results
4. Format prices as ₹amount (e.g., ₹499, ₹1,299)
5. For order queries, only available for logged-in users
6. Be warm, friendly, and fashion-forward in tone
7. Proactively suggest related products or complementary items`;

type Role = 'user' | 'assistant';
interface StoredTurn { role: Role; text: string; }

// Groq message types
type GroqMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string; tool_calls?: Groq.Chat.ChatCompletionMessageToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly groq: Groq;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.groq = new Groq({ apiKey: this.config.get<string>('groq.apiKey') ?? '' });
  }

  async chat(message: string, sessionId: string, userId?: string): Promise<ChatResponse> {
    const key     = `ml:chat:session:${sessionId}`;
    const stored  = (await this.redis.getJson<StoredTurn[]>(key)) ?? [];
    const tools   = this.buildTools();
    const collected: ChatProduct[] = [];

    // Build message array for Groq
    const messages: GroqMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...stored.map(t => ({ role: t.role, content: t.text })),
      { role: 'user', content: message },
    ];

    // ── Agentic tool-use loop ──────────────────────────────────────────────
    let iterations = 0;
    while (iterations < MAX_TOOL_ITER) {
      iterations++;
      const res = await this.groq.chat.completions.create({
        model: MODEL,
        messages: messages as Groq.Chat.ChatCompletionMessageParam[],
        tools,
        tool_choice: 'auto',
        max_tokens: 1024,
        temperature: 0.7,
      });

      const choice = res.choices[0];

      if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls?.length) {
        // Final text response
        const reply = choice.message.content ?? 'Sorry, I could not process that. Please try again.';

        // Persist clean turns
        const updated: StoredTurn[] = [
          ...stored,
          { role: 'user',      text: message },
          { role: 'assistant', text: reply   },
        ];
        await this.redis.setJson(key, updated.slice(-MAX_TURNS), CHAT_TTL);

        return {
          reply,
          products: collected.length > 0 ? collected.slice(0, 6) : undefined,
          sessionId,
        };
      }

      // Add assistant's tool-call message to context
      messages.push({
        role: 'assistant',
        content: choice.message.content ?? '',
        tool_calls: choice.message.tool_calls,
      });

      // Execute every tool call and append results
      for (const call of choice.message.tool_calls) {
        const input = JSON.parse(call.function.arguments ?? '{}') as Record<string, unknown>;
        const out   = await this.executeTool(call.function.name, input, userId);
        if (out.products) collected.push(...out.products);
        messages.push({
          role:         'tool',
          tool_call_id: call.id,
          content:      JSON.stringify(out.data),
        });
      }
    }

    // Fallback if max iterations reached without a final text response
    return { reply: 'Sorry, I took too long to process that. Please try again.', sessionId };
  }

  // ─── Tool executor ──────────────────────────────────────────────────────────

  private async executeTool(
    name: string,
    input: Record<string, unknown>,
    userId?: string,
  ): Promise<{ data: unknown; products?: ChatProduct[] }> {
    try {
      switch (name) {
        case 'search_products':       return this.searchProducts(input);
        case 'get_trending_products': return this.getTrendingProducts(input);
        case 'get_product_details':   return this.getProductDetails(String(input.slug ?? ''));
        case 'get_order_status':      return this.getOrderStatus(userId, input.orderId as string | undefined);
        case 'get_store_info':        return this.getStoreInfo(String(input.topic ?? 'general'));
        default:                      return { data: 'Unknown tool' };
      }
    } catch (err) {
      this.logger.error(`Tool "${name}" failed: ${(err as Error).message}`);
      return { data: 'Could not fetch data at the moment.' };
    }
  }

  // ─── Tool definitions (OpenAI/Groq format) ──────────────────────────────────

  private buildTools(): Groq.Chat.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description: 'Search and filter products in the MoonLight fashion store. ALWAYS call this when the user asks about clothing, outfits, or wants recommendations.',
          parameters: {
            type: 'object',
            properties: {
              query:       { type: 'string',  description: 'Search query — name, style, color, occasion' },
              category:    { type: 'string',  description: 'Men, Women, or Kids' },
              subCategory: { type: 'string',  description: 'Topwear, Bottomwear, or Winterwear' },
              minPrice:    { type: 'number',  description: 'Minimum price in ₹' },
              maxPrice:    { type: 'number',  description: 'Maximum price in ₹' },
              bestseller:  { type: 'boolean', description: 'Only bestsellers' },
              sort:        { type: 'string',  description: 'newest | price_asc | price_desc | rating' },
              limit:       { type: 'number',  description: 'Max results (default 4, max 6)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_trending_products',
          description: 'Get the most popular/trending bestseller products in the store.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of products (default 4)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_product_details',
          description: 'Get full details of a specific product — description, sizes, stock, and rating.',
          parameters: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Product slug identifier' },
            },
            required: ['slug'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_order_status',
          description: "Get a logged-in user's recent orders or check a specific order's status.",
          parameters: {
            type: 'object',
            properties: {
              orderId: { type: 'string', description: 'Specific order ID (omit to list recent orders)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_store_info',
          description: 'Get store policies — shipping, returns, payment methods, or contact info.',
          parameters: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'shipping | returns | payment | contact | general' },
            },
          },
        },
      },
    ];
  }

  // ─── Tool implementations ───────────────────────────────────────────────────

  private async searchProducts(
    input: Record<string, unknown>,
  ): Promise<{ data: unknown; products: ChatProduct[] }> {
    const where: Record<string, unknown> = { isActive: true };
    if (input.category)         where.category    = input.category;
    if (input.subCategory)      where.subCategory = input.subCategory;
    if (input.bestseller === true) where.isBestseller = true;

    if (input.query) {
      const q = String(input.query);
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (input.minPrice || input.maxPrice) {
      const price: Record<string, number> = {};
      if (input.minPrice) price.gte = Number(input.minPrice);
      if (input.maxPrice) price.lte = Number(input.maxPrice);
      where.price = price;
    }

    const orderBy: Record<string, string> =
      input.sort === 'price_asc'  ? { price: 'asc' }     :
      input.sort === 'price_desc' ? { price: 'desc' }    :
      input.sort === 'rating'     ? { avgRating: 'desc' } :
                                    { createdAt: 'desc' };

    const limit = Math.min(Number(input.limit ?? 4), 6);

    const products = await this.prisma.product.findMany({
      where, orderBy, take: limit,
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { id: true, size: true, stock: true } },
      },
    });

    return {
      data: products.map(p => ({
        name: p.name, slug: p.slug, price: `₹${p.price}`,
        category: p.category, subCategory: p.subCategory,
        isBestseller: p.isBestseller,
        availableSizes: p.variants.filter(v => v.stock > 0).map(v => v.size),
      })),
      products: products.map(p => this.toChat(p)),
    };
  }

  private async getTrendingProducts(
    input: Record<string, unknown>,
  ): Promise<{ data: unknown; products: ChatProduct[] }> {
    const limit = Math.min(Number(input.limit ?? 4), 6);
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isBestseller: true },
      orderBy: { avgRating: 'desc' },
      take: limit,
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { id: true, size: true, stock: true } },
      },
    });
    return {
      data: products.map(p => ({ name: p.name, slug: p.slug, price: `₹${p.price}` })),
      products: products.map(p => this.toChat(p)),
    };
  }

  private async getProductDetails(
    slug: string,
  ): Promise<{ data: unknown; products: ChatProduct[] }> {
    const p = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images:   { where: { isPrimary: true }, take: 1 },
        variants: { select: { id: true, size: true, stock: true } },
      },
    });
    if (!p) return { data: 'Product not found.', products: [] };
    return {
      data: {
        name: p.name, price: `₹${p.price}`,
        description: p.description,
        category: p.category, subCategory: p.subCategory,
        rating: p.avgRating, reviewCount: p.reviewCount,
        sizes: p.variants.map(v => ({ size: v.size, inStock: v.stock > 0 })),
      },
      products: [this.toChat(p)],
    };
  }

  private async getOrderStatus(
    userId?: string,
    orderId?: string,
  ): Promise<{ data: unknown }> {
    if (!userId) return { data: 'Please log in to view your orders.' };

    if (orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, userId },
        select: {
          id: true, status: true, paymentStatus: true,
          total: true, createdAt: true,
          _count: { select: { items: true } },
        },
      });
      if (!order) return { data: 'Order not found.' };
      return {
        data: {
          orderId: order.id, status: order.status,
          paymentStatus: order.paymentStatus,
          total: `₹${order.total}`, itemCount: order._count.items,
          placedAt: order.createdAt,
        },
      };
    }

    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, status: true, total: true, createdAt: true,
        _count: { select: { items: true } },
      },
    });
    return {
      data: orders.map(o => ({
        orderId: o.id, status: o.status,
        total: `₹${o.total}`, itemCount: o._count.items,
        placedAt: o.createdAt,
      })),
    };
  }

  private getStoreInfo(topic: string): { data: string } {
    const info: Record<string, string> = {
      shipping: 'Free delivery on orders above ₹999. Standard ₹10 delivery fee. Estimated delivery: 3–7 business days across India.',
      returns:  '7-day easy returns on unused items in original packaging. Initiate from your Orders page.',
      payment:  'Cash on Delivery (COD), Stripe (international cards), Razorpay (UPI, Net Banking, Indian cards).',
      contact:  'Email: support@moonlight.com | Support hours: Mon–Sat, 9 AM–6 PM IST.',
      general:  'MoonLight is a premium Indian fashion store for Men, Women, and Kids — Topwear, Bottomwear, and Winterwear.',
    };
    return { data: info[topic] ?? info.general };
  }

  private toChat(p: {
    id: string; name: string; slug: string; price: unknown;
    category: string; subCategory: string; isBestseller: boolean;
    images: { url: string }[];
    variants: { id: string; size: string; stock: number }[];
  }): ChatProduct {
    return {
      id: p.id, name: p.name, slug: p.slug,
      price: String(p.price),
      image: p.images[0]?.url ?? '',
      category: p.category, subCategory: p.subCategory,
      isBestseller: p.isBestseller,
      variants: p.variants,
    };
  }
}
