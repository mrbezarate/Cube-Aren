import { create } from 'zustand';

interface OnboardingAnswers {
  role: string;
  games: string[];
  goals: string[];
}

interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  answers: OnboardingAnswers;
  setStep: (step: number) => void;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  complete: () => void;
  reset: () => void;
}

const initialAnswers: OnboardingAnswers = {
  role: '',
  games: [],
  goals: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isCompleted: false,
  currentStep: 1,
  answers: initialAnswers,
  setStep: (step) => set({ currentStep: step }),
  setAnswer: (key, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value,
      },
    })),
  complete: () => set({ isCompleted: true }),
  reset: () => set({ isCompleted: false, currentStep: 1, answers: initialAnswers }),
}));
