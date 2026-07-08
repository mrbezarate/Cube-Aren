import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export const COMMUNITY_GAMES = [
  'cs2',
  'dota2',
  'valorant',
  'lol',
  'pubg',
  'apex',
  'custom',
] as const;

export const COMMUNITY_TAGS = [
  'discussion',
  'lfg',
  'guide',
  'news',
  'question',
  'meta',
] as const;

export class CreatePostDto {
  @IsIn(COMMUNITY_GAMES as unknown as string[])
  game: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(10000)
  content: string;

  @IsOptional()
  @IsIn(COMMUNITY_TAGS as unknown as string[])
  tag?: string;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(3000)
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class ListPostsQueryDto {
  @IsOptional()
  @IsIn(COMMUNITY_GAMES as unknown as string[])
  game?: string;

  @IsOptional()
  @IsIn(COMMUNITY_TAGS as unknown as string[])
  tag?: string;

  @IsOptional()
  @IsIn(['new', 'top', 'hot'])
  sort?: 'new' | 'top' | 'hot';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
