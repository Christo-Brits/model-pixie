
import { create } from 'zustand';

interface ModelGenerationState {
  imageQuality: 'low' | 'medium' | 'high';
  useTransparentBackground: boolean;
  randomSeed?: number;
  
  // Actions
  setImageQuality: (quality: 'low' | 'medium' | 'high') => void;
  setUseTransparentBackground: (transparent: boolean) => void;
  setRandomSeed: (seed?: number) => void;
  generateNewRandomSeed: () => void;
  getImageOptions: () => {
    quality: 'low' | 'medium' | 'high';
    background: 'opaque' | 'transparent';
    seed?: number;
  };
}

export const useModelGenerationStore = create<ModelGenerationState>((set, get) => ({
  imageQuality: 'high',
  useTransparentBackground: false,
  randomSeed: undefined,
  
  setImageQuality: (quality) => set({ imageQuality: quality }),
  setUseTransparentBackground: (transparent) => set({ useTransparentBackground: transparent }),
  setRandomSeed: (seed) => set({ randomSeed: seed }),
  
  generateNewRandomSeed: () => set({ 
    randomSeed: Math.floor(Math.random() * 2147483647) 
  }),
  
  getImageOptions: () => ({
    quality: get().imageQuality,
    background: get().useTransparentBackground ? 'transparent' : 'opaque',
    seed: get().randomSeed
  })
}));
