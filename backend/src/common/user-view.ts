import { User } from '../entities/user.entity';

export const USER_CARD_FIELDS = [
  'id', 'username', 'displayName', 'avatarUrl', 'cardBannerUrl',
  'gender', 'mainGame', 'level', 'followersCount',
] as const;

export type UserCard = Pick<User, (typeof USER_CARD_FIELDS)[number]>;

export function toUserCard(user: User | null | undefined): UserCard | null {
  if (!user) return null;
  const result = {} as UserCard;
  for (const field of USER_CARD_FIELDS) (result as any)[field] = user[field];
  return result;
}
