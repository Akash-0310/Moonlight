import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string;
  category: string;
  subCategory: string;
  isBestseller: boolean;
  variants: { id: string; size: string; stock: number }[];
}

export interface ChatResponse {
  reply: string;
  products?: ChatProduct[];
  sessionId: string;
}
