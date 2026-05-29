import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId: string;

  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}
