import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── User Routes (JWT required globally) ───────────────────────────────────

  /**
   * POST /orders
   * Place a new order. Handles COD, Stripe, and Razorpay.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  placeOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceOrderDto,
  ) {
    return this.ordersService.placeOrder(user.id, dto);
  }

  /**
   * GET /orders/my
   * Retrieve the authenticated user's order history.
   */
  @Get('my')
  getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getMyOrders(user.id);
  }

  /**
   * POST /orders/verify-stripe
   * Verify a Stripe checkout session and mark the order as paid.
   */
  @Post('verify-stripe')
  @HttpCode(HttpStatus.OK)
  verifyStripe(
    @CurrentUser() user: AuthenticatedUser,
    @Body('sessionId') sessionId: string,
  ) {
    return this.ordersService.verifyStripe(user.id, sessionId);
  }

  /**
   * POST /orders/verify-razorpay
   * Verify a Razorpay payment signature and mark the order as paid.
   */
  @Post('verify-razorpay')
  @HttpCode(HttpStatus.OK)
  verifyRazorpay(
    @CurrentUser() user: AuthenticatedUser,
    @Body('razorpayOrderId') razorpayOrderId: string,
    @Body('razorpayPaymentId') razorpayPaymentId: string,
    @Body('signature') signature: string,
  ) {
    return this.ordersService.verifyRazorpay(user.id, razorpayOrderId, razorpayPaymentId, signature);
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  /**
   * GET /orders
   * Admin: retrieve all orders with user info and items.
   */
  @Get()
  @Roles(Role.admin)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  /**
   * PATCH /orders/:id/status
   * Admin: update the status of an order.
   */
  @Patch(':id/status')
  @Roles(Role.admin)
  updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(orderId, dto);
  }
}
