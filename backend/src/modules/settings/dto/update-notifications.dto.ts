import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  // Email notifications
  @IsOptional()
  @IsBoolean()
  emailNewTournament?: boolean;

  @IsOptional()
  @IsBoolean()
  emailTournamentStart?: boolean;

  @IsOptional()
  @IsBoolean()
  emailBetResult?: boolean;

  @IsOptional()
  @IsBoolean()
  emailTeamRequest?: boolean;

  @IsOptional()
  @IsBoolean()
  emailTeamInvite?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNewMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  emailWeeklyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  emailMarketing?: boolean;

  // Push notifications
  @IsOptional()
  @IsBoolean()
  pushNewMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNewFollower?: boolean;

  @IsOptional()
  @IsBoolean()
  pushTournamentStart?: boolean;

  @IsOptional()
  @IsBoolean()
  pushBetResult?: boolean;

  @IsOptional()
  @IsBoolean()
  pushTeamRequest?: boolean;

  // In-app notifications
  @IsOptional()
  @IsBoolean()
  inAppShowBadges?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppShowRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppShowNotifications?: boolean;
}
