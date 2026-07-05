'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Save, AlertCircle, User as UserIcon } from 'lucide-react';
import { GameType, Gender } from '@/types';

const GAMES: { id: GameType; name: string; icon: string }[] = [
  { id: 'cs2', name: 'CS2', icon: '🎯' },
  { id: 'dota2', name: 'Dota 2', icon: '⚔️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'lol', name: 'LoL', icon: '🏆' },
  { id: 'pubg', name: 'PUBG', icon: '🎮' },
  { id: 'apex', name: 'Apex', icon: '🚀' },
];

const GENDERS: { id: Gender; label: string; icon: string }[] = [
  { id: 'male', label: 'Мужской', icon: '♂' },
  { id: 'female', label: 'Женский', icon: '♀' },
  { id: 'other', label: 'Другое', icon: '?' },
];

export default function SettingsProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [cardBannerUrl, setCardBannerUrl] = useState('');
  const [uploadingCardBanner, setUploadingCardBanner] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<Gender>('other');
  const [mainGame, setMainGame] = useState<GameType | ''>('');
  const [favoriteGames, setFavoriteGames] = useState<GameType[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await api.users.getFullProfile(user.id);
      setProfileData(data);

      setUsername(data.username);
      setDisplayName(data.displayName || '');
      setTagline(data.tagline || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatarUrl || '');
      setBannerUrl(data.bannerUrl || '');
      setCardBannerUrl(data.cardBannerUrl || '');
      setCountry(data.country || '');
      setCity(data.city || '');
      setGender(data.gender || 'other');
      setMainGame(data.mainGame || '');
      setFavoriteGames((data.favoriteGames || []) as GameType[]);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleCardBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла превышает 5 МБ');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingCardBanner(true);
    try {
      const res = await api.users.uploadCardBanner(formData);
      setCardBannerUrl(res.cardBannerUrl);
      toast.success('Фон карточки успешно загружен!');
    } catch (error: any) {
      console.error('Card banner upload error:', error);
      toast.error(error.response?.data?.message || 'Ошибка при загрузке фона');
    } finally {
      setUploadingCardBanner(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const updates: any = {};
    let hasChanges = false;

    if (username !== profileData.username) {
      updates.username = username;
      hasChanges = true;
    }
    if (bio !== (profileData.bio || '')) {
      updates.bio = bio;
      hasChanges = true;
    }
    if (displayName !== (profileData.displayName || '')) {
      updates.displayName = displayName;
      hasChanges = true;
    }
    if (tagline !== (profileData.tagline || '')) {
      updates.tagline = tagline;
      hasChanges = true;
    }
    if (avatarUrl !== (profileData.avatarUrl || '')) {
      updates.avatarUrl = avatarUrl;
      hasChanges = true;
    }
    if (bannerUrl !== (profileData.bannerUrl || '')) {
      updates.bannerUrl = bannerUrl;
      hasChanges = true;
    }
    if (cardBannerUrl !== (profileData.cardBannerUrl || '')) {
      updates.cardBannerUrl = cardBannerUrl;
      hasChanges = true;
    }
    if (country !== (profileData.country || '')) {
      updates.country = country;
      hasChanges = true;
    }
    if (city !== (profileData.city || '')) {
      updates.city = city;
      hasChanges = true;
    }
    if (gender !== (profileData.gender || 'other')) {
      updates.gender = gender;
      hasChanges = true;
    }
    if (mainGame && mainGame !== (profileData.mainGame || '')) {
      updates.mainGame = mainGame;
      hasChanges = true;
    }
    if (JSON.stringify(favoriteGames) !== JSON.stringify(profileData.favoriteGames || [])) {
      updates.favoriteGames = favoriteGames;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.success('Нет изменений для сохранения');
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await api.users.updateProfile(updates);
      setUser(updatedUser);
      toast.success('Профиль обновлён!');
      await loadProfile();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-white text-center">Загрузка...</div>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card className="p-6">
        <div className="text-white text-center">Профиль не найден</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="font-orbitron font-bold text-xl text-white mb-6 flex items-center gap-2">
        <UserIcon className="w-6 h-6 text-neon-purple" />
        Настройки профиля
      </h2>

      <div className="space-y-6">
        {/* Username */}
        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
            Ник
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите ник"
            disabled={!profileData.canChangeUsername}
            className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {!profileData.canChangeUsername && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-500">
                Ник можно менять раз в 3 дня. Следующее изменение через {profileData.usernameChangeDays}{' '}
                {profileData.usernameChangeDays === 1 ? 'день' : 'дня'}.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Отображаемое имя
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Например, ShadowFox"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Короткий статус
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Играю агрессивно, врываюсь первым"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
            URL аватарки
          </label>
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            disabled={!profileData.canChangeAvatar}
            className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {avatarUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={avatarUrl}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover border-2 border-arena-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.svg';
                }}
              />
              <span className="text-xs text-gray-400">Предпросмотр</span>
            </div>
          )}
          {!profileData.canChangeAvatar && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-500">
                Аватарку можно менять раз в 7 дней после первого изменения. Следующее изменение через{' '}
                {profileData.avatarChangeDays}{' '}
                {profileData.avatarChangeDays === 1
                  ? 'день'
                  : profileData.avatarChangeDays < 5
                    ? 'дня'
                    : 'дней'}{' '}
                и {profileData.avatarChangeHours || 0}{' '}
                {profileData.avatarChangeHours === 1
                  ? 'час'
                  : profileData.avatarChangeHours < 5
                    ? 'часа'
                    : 'часов'}
                .
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
            URL баннера профиля
          </label>
          <input
            type="text"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://example.com/banner.jpg"
            disabled={!profileData.canChangeBanner}
            className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {bannerUrl && (
            <div className="mt-3">
              <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-arena-border">
                <img
                  src={bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 mt-2 block">Предпросмотр баннера</span>
            </div>
          )}
          {!profileData.canChangeBanner && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-500">
                Баннер можно менять раз в 7 дней после первого изменения. Следующее изменение через{' '}
                {profileData.bannerChangeDays}{' '}
                {profileData.bannerChangeDays === 1
                  ? 'день'
                  : profileData.bannerChangeDays < 5
                    ? 'дня'
                    : 'дней'}{' '}
                и {profileData.bannerChangeHours || 0}{' '}
                {profileData.bannerChangeHours === 1
                  ? 'час'
                  : profileData.bannerChangeHours < 5
                    ? 'часа'
                    : 'часов'}
                .
              </p>
            </div>
          )}
        </div>

        {/* Card Background Banner Upload */}
        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
            Фон карточки профиля (PNG, JPEG, GIF)
          </label>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <input
              type="text"
              value={cardBannerUrl}
              onChange={(e) => setCardBannerUrl(e.target.value)}
              placeholder="https://example.com/card-banner.jpg или загрузите файл"
              className="flex-1 px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={handleCardBannerUpload}
                disabled={uploadingCardBanner}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
              />
              <Button
                variant="secondary"
                disabled={uploadingCardBanner}
                type="button"
                className="w-full sm:w-auto h-full"
              >
                {uploadingCardBanner ? 'Загрузка...' : 'Загрузить файл'}
              </Button>
            </div>
          </div>
          {cardBannerUrl && (
            <div className="mt-3">
              <div className="relative w-full max-w-sm h-32 rounded-lg overflow-hidden border-2 border-arena-border bg-arena-dark flex items-center justify-center">
                <img
                  src={cardBannerUrl}
                  alt="Card Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 mt-2 block">Предпросмотр фона карточки</span>
            </div>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
            О себе
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите о себе..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors resize-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
            Пол
          </label>
          <div className="grid grid-cols-3 gap-3">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGender(g.id)}
                disabled={!profileData.canChangeGender && gender !== g.id}
                className={`
                  p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                  ${
                    gender === g.id
                      ? 'border-neon-purple bg-neon-purple/10'
                      : 'border-arena-border bg-white/5 hover:border-neon-purple/50'
                  }
                  ${!profileData.canChangeGender && gender !== g.id ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="text-2xl">{g.icon}</span>
                <span className="text-sm font-orbitron text-white">{g.label}</span>
              </button>
            ))}
          </div>
          {!profileData.canChangeGender && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-500">
                Пол можно менять раз в 7 дней после первого изменения. Следующее изменение через{' '}
                {profileData.genderChangeDays}{' '}
                {profileData.genderChangeDays === 1
                  ? 'день'
                  : profileData.genderChangeDays < 5
                    ? 'дня'
                    : 'дней'}{' '}
                и {profileData.genderChangeHours || 0}{' '}
                {profileData.genderChangeHours === 1
                  ? 'час'
                  : profileData.genderChangeHours < 5
                    ? 'часа'
                    : 'часов'}
                .
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Страна
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Россия"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-2">
              Город
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Москва"
              className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple transition-colors"
            />
          </div>
        </div>

        {/* Main Game */}
        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
            Основная игра
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setMainGame(game.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                  ${
                    mainGame === game.id
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-arena-border bg-white/5 hover:border-neon-blue/50'
                  }
                `}
              >
                <span className="text-xl">{game.icon}</span>
                <span className="text-sm font-orbitron text-white">{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-orbitron font-semibold text-gray-300 mb-3">
            Любимые игры
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GAMES.map((game) => {
              const selected = favoriteGames.includes(game.id);
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() =>
                    setFavoriteGames((prev) =>
                      selected
                        ? prev.filter((item) => item !== game.id)
                        : prev.length >= 5
                          ? prev
                          : [...prev, game.id],
                    )
                  }
                  className={`
                    p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                    ${
                      selected
                        ? 'border-neon-gold bg-neon-gold/10'
                        : 'border-arena-border bg-white/5 hover:border-neon-gold/40'
                    }
                  `}
                >
                  <span className="text-xl">{game.icon}</span>
                  <span className="text-sm font-orbitron text-white">{game.name}</span>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-400 mt-2">Можно выбрать до 5 игр.</div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-arena-border">
          <Button
            onClick={handleSave}
            loading={saving}
            variant="primary"
            className="w-full py-3 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Сохранить изменения
          </Button>
        </div>
      </div>
    </Card>
  );
}
