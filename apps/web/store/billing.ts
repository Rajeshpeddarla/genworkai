import { create } from 'zustand';

interface BillingState {
  tier: 'free' | 'pro';
  upgrade: () => void;
  downgrade: () => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  tier: 'free',
  upgrade: () => set({ tier: 'pro' }),
  downgrade: () => set({ tier: 'free' }),
}));
