import { create } from 'zustand';

interface OnboardingAnswers {
  games: string[];
  mainGame?: string;
  gender?: string;
  source?: string;
}

interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  answers: OnboardingAnswers;
  setStep: (step: number) => void;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  complete: () => void;
  reset: () => void;
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const initialAnswers: OnboardingAnswers = {
  games: [],
  mainGame: '',
  gender: '',
  source: '',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isCompleted: false,
  currentStep: 1,
  answers: initialAnswers,
  isOpen: false,
  setStep: (step) => set({ currentStep: step }),
  setAnswer: (key, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value,
      },
    })),
  complete: () => set({ isCompleted: true, isOpen: false }),
  reset: () => set({ 
    isCompleted: false, 
    currentStep: 1, 
    answers: { games: [], mainGame: '', gender: '', source: '' },
    isOpen: false 
  }),
  open: () => set({ 
    currentStep: 1, 
    answers: { games: [], mainGame: '', gender: '', source: '' },
    isOpen: true 
  }),
  close: () => set({ isOpen: false }),
}));
