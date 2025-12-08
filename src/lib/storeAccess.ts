
import { StoreApi, UseBoundStore } from 'zustand';
import { CombinedState } from '../store/useStore';

let store: UseBoundStore<StoreApi<CombinedState>> | null = null;

export const setStore = (s: UseBoundStore<StoreApi<CombinedState>>) => {
  store = s;
};

export const getStore = () => {
  if (!store) {
    throw new Error('Store not initialized');
  }
  return store;
};
