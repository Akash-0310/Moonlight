import { IsString, IsInt, Min } from 'class-validator';

export class UpdateCartDto {
  @IsString()
  cartItemId: string;

  @IsInt()
  @Min(0)
  quantity: number;
}
