'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/store/onboarding.store';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Shield, Trophy, Users, Coins, Sparkles, LogIn, Mail } from 'lucide-react';

const GAMES = [
  { id: 'cs2', name: 'CS 2', icon: '🔫' },
  { id: 'dota2', name: 'Dota 2', icon: '⚔️' },
  { id: 'valorant', name: 'Valorant', icon: '🎯' },
  { id: 'lol', name: 'League of Legends', icon: '🔮' },
  { id: 'pubg', name: 'PUBG Mobile', icon: '🪂' },
  { id: 'apex', name: 'Apex Legends', icon: '⚡' },
];

const GOALS = [
  { id: 'earn', name: 'Заработать кредиты 💰', icon: <Coins className="text-neon-gold" /> },
  { id: 'compete', name: 'Соревноваться с лучшими 🏆', icon: <Trophy className="text-neon-purple" /> },
  { id: 'teams', name: 'Найти команду 🤝', icon: <Users className="text-neon-blue" /> },
  { id: 'organize', name: 'Создавать свои турниры 🎯', icon: <Sparkles className="text-pink-500" /> },
];

export default function OnboardingModal() {
  const { currentStep, answers, setStep, setAnswer, complete, isCompleted } = useOnboardingStore();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const router = useRouter();

  if (isCompleted) return null;

  const handleNext = async () => {
    if (currentStep < 3) {
      setStep(currentStep + 1);
    } else {
      // Step 3 finished - check auth
      if (!isAuthenticated) {
        setStep(4);
      } else {
        await submitOnboarding();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const submitOnboarding = async () => {
    try {
      const updatedUser = await api.users.onboarding({
        role: answers.role,
        games: answers.games,
        goals: answers.goals,
      });
      setUser(updatedUser);
      complete();
      toast.success('Онбординг успешно пройден!');
    } catch {
      toast.error('Ошибка при сохранении результатов');
    }
  };

  const selectRole = (role: string) => {
    setAnswer('role', role);
    setStep(2);
  };

  const toggleGame = (gameId: string) => {
    const current = answers.games;
    if (current.includes(gameId)) {
      setAnswer('games', current.filter((g) => g !== gameId));
    } else {
      setAnswer('games', [...current, gameId]);
    }
  };

  const toggleGoal = (goalId: string) => {
    const current = answers.goals;
    if (current.includes(goalId)) {
      setAnswer('goals', current.filter((g) => g !== goalId));
    } else {
      setAnswer('goals', [...current, goalId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-panel border border-arena-border p-6 rounded-2xl relative overflow-hidden flex flex-col min-h-[460px] justify-between shadow-2xl"
      >
        {/* Neon lines design */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent shadow-neon-purple" />
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? 'w-8 bg-neon-purple shadow-neon-purple'
                    : currentStep > step
                    ? 'w-4 bg-neon-blue'
                    : 'w-4 bg-arena-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-orbitron">ШАГ {currentStep} ИЗ 4</span>
        </div>

        {/* Form Body */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide">КТО ТЫ НА АРЕНЕ?</h2>
                  <p className="text-xs text-gray-400">Выберите вашу основную роль на платформе</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => selectRole('participant')}
                    className={`p-6 rounded-xl flex flex-col items-center justify-center gap-3 border text-center transition-all ${
                      answers.role === 'participant'
                        ? 'border-neon-blue bg-neon-blue/10 shadow-neon-blue text-white'
                        : 'border-arena-border bg-arena-card/40 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Trophy className="w-10 h-10 text-neon-blue" />
                    <div>
                      <div className="font-orbitron font-bold text-sm">УЧАСТНИК</div>
                      <span className="text-[10px] text-gray-400">Играй, побеждай и забирай ставки</span>
                    </div>
                  </button>

                  <button
                    onClick={() => selectRole('organizer')}
                    className={`p-6 rounded-xl flex flex-col items-center justify-center gap-3 border text-center transition-all ${
                      answers.role === 'organizer'
                        ? 'border-neon-purple bg-neon-purple/10 shadow-neon-purple text-white'
                        : 'border-arena-border bg-arena-card/40 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Shield className="w-10 h-10 text-neon-purple" />
                    <div>
                      <div className="font-orbitron font-bold text-sm">ОРГАНИЗАТОР</div>
                      <span className="text-[10px] text-gray-400">Создавай турниры и бери комиссию</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide">ТВОИ ДИСЦИПЛИНЫ</h2>
                  <p className="text-xs text-gray-400">Выберите игры, в которых вы хотите участвовать</p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3">
                  {GAMES.map((game) => {
                    const isSelected = answers.games.includes(game.id);
                    return (
                      <button
                        key={game.id}
                        onClick={() => toggleGame(game.id)}
                        className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-neon-purple bg-neon-purple/10 text-white shadow-neon-purple'
                            : 'border-arena-border bg-arena-card/40 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">{game.icon}</span>
                        <span className="text-xs font-semibold">{game.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide">ЦЕЛИ НА ПЛАТФОРМЕ</h2>
                  <p className="text-xs text-gray-400">Чего вы хотите добиться здесь?</p>
                </div>

                <div className="space-y-2 pt-2">
                  {GOALS.map((goal) => {
                    const isSelected = answers.goals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${
                          isSelected
                            ? 'border-neon-blue bg-neon-blue/10 text-white shadow-neon-blue'
                            : 'border-arena-border bg-arena-card/40 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {goal.icon}
                        <span className="font-orbitron text-xs font-bold">{goal.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-orbitron font-bold text-white tracking-wide">ПОСЛЕДНИЙ ШАГ</h2>
                  <p className="text-xs text-gray-400">Создайте аккаунт для сохранения ваших настроек</p>
                </div>

                <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
                  <button
                    onClick={() => {
                      complete();
                      router.push('/auth/register');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg text-white font-orbitron font-bold hover:shadow-neon-purple transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> СОЗДАТЬ АККАУНТ
                  </button>
                  <button
                    onClick={() => {
                      complete();
                      router.push('/auth/login');
                    }}
                    className="w-full py-3 border border-arena-border bg-arena-card/40 rounded-lg text-gray-300 hover:border-gray-500 font-orbitron font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> ВОЙТИ В АККАУНТ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-arena-border">
          {currentStep > 1 && currentStep < 4 ? (
            <button
              onClick={handleBack}
              className="text-xs text-gray-400 hover:text-white font-orbitron transition-all"
            >
              ← НАЗАД
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 && (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !answers.role) ||
                (currentStep === 2 && answers.games.length === 0) ||
                (currentStep === 3 && answers.goals.length === 0)
              }
              className="px-6 py-2 bg-neon-purple rounded-lg text-white font-orbitron font-bold hover:shadow-neon-purple disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              ДАЛЕЕ →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
