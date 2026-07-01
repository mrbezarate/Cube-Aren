import { IsEnum, IsBoolean, IsOptional } from 'class-validator';

enum PrivacyLevel {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  NOBODY = 'nobody',
}

enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  canMessageMe?: PrivacyLevel;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  canSeeStats?: PrivacyLevel;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  canSeeFriends?: PrivacyLevel;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  canInviteToTeam?: PrivacyLevel;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  showOnlineStatus?: PrivacyLevel;

  @IsOptional()
  @IsBoolean()
  showProfileVisitors?: boolean;

  @IsOptional()
  @IsBoolean()
  showTournamentHistory?: boolean;
}
