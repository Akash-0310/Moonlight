import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('add')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('update')
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCartDto,
  ) {
    return this.cartService.updateItem(user.id, dto);
  }

  @Delete('item/:cartItemId')
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cartItemId') cartItemId: string,
  ) {
    return this.cartService.removeItem(user.id, cartItemId);
  }

  @Delete()
  clearCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.clearCart(user.id);
  }
}
