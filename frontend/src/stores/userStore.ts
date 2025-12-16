/**
 * 使用者狀態管理
 * 
 * 管理使用者認證和個人資料
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, PublicUserInfo } from "@/types";

interface UserState {
  /** 當前使用者 */
  user: User | null;
  /** 認證 Token */
  token: string | null;
  /** 是否已登入 */
  isAuthenticated: boolean;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: string | null;
}

interface UserActions {
  /** 設置使用者（登入成功後） */
  setUser: (user: User, token: string) => void;
  /** 更新使用者資料 */
  updateUser: (updates: Partial<User>) => void;
  /** 登出 */
  logout: () => void;
  /** 設置載入狀態 */
  setLoading: (loading: boolean) => void;
  /** 設置錯誤 */
  setError: (error: string | null) => void;
  /** 獲取公開資訊 */
  getPublicInfo: () => PublicUserInfo | null;
}

/**
 * 使用者狀態 Store
 * 
 * 使用 persist 中間件保存到 localStorage
 */
export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      getPublicInfo: () => {
        const { user } = get();
        if (!user) return null;

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          rating: user.rating,
          rank: user.rank,
          wins: user.wins,
          losses: user.losses,
        };
      },
    }),
    {
      name: "gomoku-user-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
