'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/store/onboarding.store';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', icon: '🎯' },
  { id: 'dota2', name: 'Dota 2', icon: '⚔️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'lol', name: 'League of Legends', icon: '🏆' },
  { id: 'pubg', name: 'PUBG', icon: '🎮' },
  { id: 'apex', name: 'Apex Legends', icon: '🚀' },
  { id: 'custom', name: 'Другие игры', icon: '🎲' },
];

const GENDERS = [
  { id: 'male', label: 'Мужской', icon: '♂', color: 'text-blue-500', bg: 'bg-blue-500/20' },
  { id: 'female', label: 'Женский', icon: '♀', color: 'text-pink-500', bg: 'bg-pink-500/20' },
  { id: 'other', label: 'Другое', icon: '?', color: 'text-gray-500', bg: 'bg-gray-500/20' },
];

const SOURCES = [
  { id: 'friend', label: 'От друга' },
  { id: 'social', label: 'Соц. сети' },
  { id: 'search', label: 'Поиск' },
  { id: 'other', label: 'Другое' },
];

export default function OnboardingModal() {
  const { currentStep, answers, setStep, setAnswer, complete, isCompleted, isOpen, close } = useOnboardingStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Step 1: Games
  const toggleGame = (gameId: string) => {
    const current = answers.games || [];
    if (current.includes(gameId)) {
      setAnswer('games', current.filter((id) => id !== gameId));
    } else {
      setAnswer('games', [...current, gameId]);
    }
  };

  // Step 2: Main game
  const selectMainGame = (gameId: string) => {
    setAnswer('mainGame', gameId);
  };

  // Step 3: Gender
  const selectGender = (genderId: string) => {
    setAnswer('gender', genderId);
  };

  // Step 4: Source
  const selectSource = (sourceId: string) => {
    setAnswer('source', sourceId);
  };

  const handleNext = () => {
    if (currentStep === 1 && answers.games.length === 0) {
      toast.error('Выберите хотя бы одну игру');
      return;
    }
    if (currentStep === 2 && !answers.mainGame) {
      toast.error('Выберите основную игру');
      return;
    }
    if (currentStep === 2 && answers.mainGame && !answers.games.includes(answers.mainGame)) {
      toast.error('Основная игра должна быть выбрана в списке игр');
      return;
    }
    if (currentStep === 3 && !answers.gender) {
      toast.error('Выберите ваш пол');
      return;
    }
    if (currentStep === 4 && !answers.source) {
      toast.error('Выберите источник');
      return;
    }
    setStep(currentStep + 1);
  };

  const handleBack = () => {
    setStep(currentStep - 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const result = await api.users.onboarding({
        role: user?.role || 'participant',
        games: answers.games,
        mainGame: answers.mainGame,
        gender: answers.gender,
        source: answers.source,
      }) as any;

      const { user: updatedUser, accessToken, refreshToken } = result;
      useAuthStore.getState().login(updatedUser, accessToken, refreshToken);

      complete();
      close();
      toast.success('Добро пожаловать в Underground Arena! 🎮');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Ошибка сохранения. Попробуйте снова');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-arena-card border border-arena-border rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          {isCompleted && (
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Progress bar */}
          <div className="h-1 bg-arena-dark">
            <div
              className="h-full bg-gradient-to-r from-neon-purple to-neon-blue transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          <div className="p-6">
            {/* Step 1: Games */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center pb-2">
                  <h2 className="font-orbitron font-bold text-lg text-white">
                    Какие игры вас интересуют?
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Выберите хотя бы одну
                  </p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {GAMES.map((game) => {
                    const isSelected = answers.games.includes(game.id);
                    return (
                      <button
                        key={game.id}
                        onClick={() => toggleGame(game.id)}
                        className={`
                          w-full p-3 rounded-lg border transition-all flex items-center gap-3
                          ${
                            isSelected
                              ? 'border-neon-purple bg-neon-purple/10 shadow-sm shadow-neon-purple/20'
                              : 'border-arena-border bg-white/5 hover:border-neon-purple/50 hover:bg-white/8'
                          }
                        `}
                      >
                        <span className="text-xl">{game.icon}</span>
                        <span className="font-orbitron font-semibold text-sm text-white flex-1 text-left">
                          {game.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-neon-purple flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-gray-500 pt-2">
                  Выбрано: <span className="text-neon-purple font-bold">{answers.games.length}</span>
                </div>
              </motion.div>
            )}

            {/* Step 2: Main game */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center pb-2">
                  <h2 className="font-orbitron font-bold text-lg text-white">
                    Какая игра у вас основная?
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Нужна для профиля и стартового матчмейкинга
                  </p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {GAMES.filter((game) => answers.games.includes(game.id)).map((game) => {
                    const isSelected = answers.mainGame === game.id;
                    return (
                      <button
                        key={game.id}
                        onClick={() => selectMainGame(game.id)}
                        className={`
                          w-full p-3 rounded-lg border transition-all flex items-center gap-3
                          ${
                            isSelected
                              ? 'border-neon-blue bg-neon-blue/10 shadow-sm shadow-neon-blue/20'
                              : 'border-arena-border bg-white/5 hover:border-neon-blue/50 hover:bg-white/8'
                          }
                        `}
                      >
                        <span className="text-2xl">
                          {game.icon}
                        </span>
                        <span className="font-orbitron font-semibold text-sm text-white flex-1 text-left">
                          {game.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-neon-blue flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Gender */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center pb-2">
                  <h2 className="font-orbitron font-bold text-lg text-white">
                    Укажите ваш пол
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Это поле можно будет поменять в профиле позже
                  </p>
                </div>

                <div className="space-y-2">
                  {GENDERS.map((gender) => {
                    const isSelected = answers.gender === gender.id;
                    return (
                      <button
                        key={gender.id}
                        onClick={() => selectGender(gender.id)}
                        className={`
                          w-full p-3 rounded-lg border transition-all flex items-center gap-3
                          ${
                            isSelected
                              ? `${gender.bg} border-white/20 shadow-sm`
                              : 'border-arena-border bg-white/5 hover:border-white/20 hover:bg-white/8'
                          }
                        `}
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${gender.bg} ${gender.color} text-xl font-bold`}>
                          {gender.icon}
                        </span>
                        <span className="font-orbitron font-semibold text-sm text-white flex-1 text-left">
                          {gender.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Source */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center pb-2">
                  <h2 className="font-orbitron font-bold text-lg text-white">
                    Откуда вы узнали о нас?
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Это поможет нам лучше развивать платформу
                  </p>
                </div>

                <div className="space-y-2">
                  {SOURCES.map((source) => {
                    const isSelected = answers.source === source.id;
                    return (
                      <button
                        key={source.id}
                        onClick={() => selectSource(source.id)}
                        className={`
                          w-full p-3 rounded-lg border transition-all flex items-center gap-3
                          ${
                            isSelected
                              ? 'border-neon-gold bg-neon-gold/10 shadow-sm shadow-neon-gold/20'
                              : 'border-arena-border bg-white/5 hover:border-neon-gold/50 hover:bg-white/8'
                          }
                        `}
                      >
                        <span className="font-orbitron font-semibold text-sm text-white flex-1 text-left">
                          {source.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-neon-gold flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-arena-border/50">
              <div className="flex-1">
                {currentStep > 1 && (
                  <Button onClick={handleBack} variant="secondary" className="w-full text-sm py-2">
                    Назад
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1 px-2 min-w-fit">
                <span className="text-xs text-gray-400 font-orbitron">
                  {currentStep}/4
                </span>
              </div>

              <div className="flex-1">
                {currentStep < 4 ? (
                  <Button onClick={handleNext} variant="primary" className="w-full text-sm py-2">
                    Далее
                  </Button>
                ) : (
                  <Button onClick={handleFinish} loading={isSubmitting} variant="primary" className="w-full text-sm py-2">
                    Готово
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
