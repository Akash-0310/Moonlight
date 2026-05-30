'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Trash2, Sparkles, ShoppingBag, Star, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useChatStore, type ChatProduct } from '@/lib/store/chat.store';
import { useCartStore } from '@/lib/store/cart.store';
import { useAuthStore } from '@/lib/store/auth.store';

const QUICK_REPLIES = [
  "What's trending?",
  "Men's topwear",
  "Women's collection",
  "Under ₹500",
  "Track my order",
  "Winterwear",
];

// ─── Main widget ─────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isOpen, isTyping, unreadCount, sendMessage, toggleChat, clearChat } =
    useChatStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const pathname = usePathname();

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    await sendMessage(text);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleQuickReply = (text: string) => {
    void sendMessage(text);
  };

  const showQuickReplies = messages.length <= 1 && !isTyping;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">

      {/* ── Chat window ── */}
      <div
        className={[
          'mb-3 flex flex-col bg-white rounded-2xl shadow-2xl border border-[#e8e8e8] overflow-hidden',
          'transition-all duration-300 ease-in-out origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 w-[370px] h-[580px] sm:w-[390px]'
            : 'opacity-0 scale-90 translate-y-4 w-[370px] h-0 pointer-events-none',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a96e] to-[#a07840] flex items-center justify-center shadow-md">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold tracking-wide leading-none">Luna</p>
              <p className="text-[#c9a96e] text-[10px] tracking-[0.15em] uppercase mt-0.5">MoonLight AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="New conversation"
              className="p-1.5 text-[#555] hover:text-[#c9a96e] transition-colors rounded-lg hover:bg-white/10"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={toggleChat}
              className="p-1.5 text-[#555] hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-[#fafafa]">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] ${msg.role === 'assistant' ? 'space-y-2.5 w-full' : ''}`}>

                {/* Bubble */}
                <div
                  className={[
                    'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-[#111] text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-[#111] border border-[#ececec] rounded-tl-none shadow-sm',
                  ].join(' ')}
                >
                  {msg.content}
                </div>

                {/* Product cards */}
                {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {msg.products.slice(0, 4).map(p => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#ececec] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-3.5">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {showQuickReplies && (
          <div className="px-3 pt-2 pb-1 bg-white border-t border-[#f0f0f0] shrink-0">
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest mb-1.5">Quick start</p>
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_REPLIES.map(r => (
                <button
                  key={r}
                  onClick={() => handleQuickReply(r)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-[#e8e8e8] text-[#555] hover:border-[#c9a96e] hover:text-[#c9a96e] transition-all duration-150 bg-white"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-[#e8e8e8] shrink-0">
          <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-full pl-4 pr-1.5 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              disabled={isTyping}
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-[#111] placeholder:text-[#bbb] outline-none disabled:opacity-60"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center hover:bg-[#c9a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={13} className="text-white translate-x-px" />
            </button>
          </div>
          <p className="text-center text-[10px] text-[#ccc] mt-1.5 tracking-wide">
            Powered by Groq
          </p>
        </div>
      </div>

      {/* ── Toggle button ── */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open AI shopping assistant'}
        className={[
          'relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center',
          'transition-all duration-200 active:scale-95',
          isOpen
            ? 'bg-[#333] hover:bg-[#555]'
            : 'bg-[#111] hover:bg-[#c9a96e]',
        ].join(' ')}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}
        >
          <X size={22} className="text-white" />
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}
        >
          <MessageCircle size={22} className="text-white" />
        </span>

        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#c9a96e] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#c9a96e] animate-ping opacity-20 pointer-events-none" />
        )}
      </button>
    </div>
  );
}

// ─── Product card (inside chat) ───────────────────────────────────────────────

function ProductCard({
  product,
  isAuthenticated,
}: {
  product: ChatProduct;
  isAuthenticated: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const inStockVariant = product.variants.find(v => v.stock > 0);
  const hasStock = !!inStockVariant;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    if (!inStockVariant) return;
    setAdding(true);
    try {
      await addItem(product.id, inStockVariant.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const rating = (product as unknown as { avgRating?: number }).avgRating;

  return (
    <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden hover:border-[#c9a96e] hover:shadow-md transition-all duration-200 group">

      {/* Image */}
      <Link href={`/product/${product.slug}`} tabIndex={-1}>
        <div className="relative h-[100px] w-full bg-[#f5f5f5] overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="180px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <ShoppingBag size={22} className="text-[#ddd]" />
            </div>
          )}

          {product.isBestseller && (
            <span className="absolute top-1.5 left-1.5 text-[9px] bg-[#c9a96e] text-white px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase">
              Best
            </span>
          )}

          {!hasStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-[10px] text-[#888] font-medium">Out of stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-2">
        <Link href={`/product/${product.slug}`}>
          <p className="text-[#111] text-[11px] font-semibold leading-tight truncate hover:text-[#c9a96e] transition-colors">
            {product.name}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[#c9a96e] text-xs font-bold">₹{Number(product.price).toLocaleString('en-IN')}</span>
          {rating !== undefined && rating > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#888]">
              <Star size={9} className="fill-[#c9a96e] text-[#c9a96e]" />
              {Number(rating).toFixed(1)}
            </span>
          )}
        </div>

        <button
          onClick={() => void handleAddToCart()}
          disabled={!hasStock || adding}
          className={[
            'mt-1.5 w-full text-[10px] py-1.5 rounded-lg font-medium tracking-wide transition-all duration-150',
            hasStock && !adding
              ? 'bg-[#111] text-white hover:bg-[#c9a96e]'
              : 'bg-[#f0f0f0] text-[#bbb] cursor-not-allowed',
          ].join(' ')}
        >
          {adding ? (
            <span className="flex items-center justify-center gap-1">
              <Package size={10} className="animate-pulse" /> Adding…
            </span>
          ) : !hasStock ? (
            'Out of Stock'
          ) : (
            '+ Add to Cart'
          )}
        </button>
      </div>
    </div>
  );
}
