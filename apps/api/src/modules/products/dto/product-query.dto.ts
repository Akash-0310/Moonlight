import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Category, SubCategory } from '@prisma/client';

export class ProductQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    if (Array.isArray(value)) return value;
    return [];
  })
  @IsEnum(Category, { each: true })
  category?: Category[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    if (Array.isArray(value)) return value;
    return [];
  })
  @IsEnum(SubCategory, { each: true })
  subCategory?: SubCategory[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  bestseller?: boolean;
}
