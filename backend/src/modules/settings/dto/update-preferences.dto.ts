import { IsEnum, IsBoolean, IsOptional, IsString, IsInt, Min } from 'class-validator';

enum Language {
  RU = 'ru',
  EN = 'en',
  UA = 'ua',
}

enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system',
}

enum ColorAccent {
  PURPLE = 'purple',
  BLUE = 'blue',
  GREEN = 'green',
  GOLD = 'gold',
}

enum TimeFormat {
  HOURS_24 = '24h',
  HOURS_12 = '12h',
}

enum ImageQuality {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class UpdateUserPreferencesDto {
  // Interface
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(ColorAccent)
  colorAccent?: ColorAccent;

  // Display
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsEnum(TimeFormat)
  timeFormat?: TimeFormat;

  // Games
  @IsOptional()
  @IsBoolean()
  hideUninterestingTournaments?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlyRegionalTournaments?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPrizePoolFilter?: number;

  // Performance
  @IsOptional()
  @IsBoolean()
  enableAnimations?: boolean;

  @IsOptional()
  @IsBoolean()
  autoplayVideos?: boolean;

  @IsOptional()
  @IsBoolean()
  preloadImages?: boolean;

  @IsOptional()
  @IsEnum(ImageQuality)
  imageQuality?: ImageQuality;

  // Content
  @IsOptional()
  @IsBoolean()
  showAdultContent?: boolean;

  @IsOptional()
  @IsBoolean()
  filterProfanity?: boolean;

  @IsOptional()
  @IsBoolean()
  hideSpoilers?: boolean;
}
