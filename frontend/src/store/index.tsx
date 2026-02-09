'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Auction, Agent, User } from '@/types';

// ============================================
// ZUSTAND STORE - GLOBAL STATE
// ============================================

interface AppState {
  // User/Session
  user: User | null;
  isAuthenticated: boolean;
  
  // Auction State
  auctions: Auction[];
  featuredAuctions: Auction[];
  liveAuctions: Auction[];
  
  // UI State
  isLoading: boolean;
  sidebarOpen: boolean;
  filterOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuctions: (auctions: Auction[]) => void;
  addAuction: (auction: Auction) => void;
  updateAuction: (id: string, updates: Partial<Auction>) => void;
  removeAuction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  toggleFilter: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  auctions: [],
  featuredAuctions: [],
  liveAuctions: [],
  isLoading: false,
  sidebarOpen: false,
  filterOpen: false,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setAuctions: (auctions) => set({ 
    auctions, 
    featuredAuctions: auctions.filter(a => a.is_featured).slice(0, 6),
    liveAuctions: auctions.filter(a => a.status === 'active').slice(0, 10),
  }),
  
  addAuction: (auction) => set((state) => ({
    auctions: [auction, ...state.auctions],
    liveAuctions: auction.status === 'active' 
      ? [auction, ...state.liveAuctions] 
      : state.liveAuctions,
  })),
  
  updateAuction: (id, updates) => set((state) => ({
    auctions: state.auctions.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ),
    featuredAuctions: state.featuredAuctions.map(a =>
      a.id === id ? { ...a, ...updates } : a
    ),
    liveAuctions: state.liveAuctions.map(a =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),
  
  removeAuction: (id) => set((state) => ({
    auctions: state.auctions.filter(a => a.id !== id),
    featuredAuctions: state.featuredAuctions.filter(a => a.id !== id),
    liveAuctions: state.liveAuctions.filter(a => a.id !== id),
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleFilter: () => set((state) => ({ filterOpen: !state.filterOpen })),
});

// ============================================
// CONTEXT PROVIDERS
// ============================================

interface AppContextType {
  // Add context providers here
  formatTimeRemaining: (endTime: Date) => string;
  formatCurrency: (amount: number) => string;
  formatRelativeTime: (date: Date) => string;
}

const defaultContext: AppContextType = {
  formatTimeRemaining: () => 'N/A',
  formatCurrency: (amount) => `$${amount.toFixed(2)}`,
  formatRelativeTime: () => 'N/A',
};

export const AppContext = createContext<AppContextType>(defaultContext);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const formatTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  return (
    <AppContext.Provider 
      value={{
        formatTimeRemaining,
        formatCurrency,
        formatRelativeTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
