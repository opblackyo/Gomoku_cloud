/**
 * 使用者與帳號系統型別定義
 * 
 * 包含段位系統和積分制度
 */

/** 段位等級 - 根據目標.md 定義 */
export type Rank = 
  | "bronze"      // 銅
  | "silver"      // 銀
  | "gold"        // 金
  | "platinum"    // 白金
  | "diamond"     // 鑽石
  | "master"      // 大師
  | "apex";       // 頂級

/** 段位配置 */
export interface RankConfig {
  name: Rank;
  displayName: string;
  minRating: number;
  maxRating: number;
  color: string;
}

/** 使用者基本資訊 */
export interface User {
  id: string;
  username: string;       // 帳號（用於登入，不可修改）
  displayName: string;    // 顯示名稱（可修改）
  email: string;
  /** ELO/Glicko-2 積分 */
  rating: number;
  rank: Rank;
  /** 勝場數 */
  wins: number;
  /** 敗場數 */
  losses: number;
  /** 平局數 */
  draws: number;
  createdAt: number;
  lastLoginAt: number;
  /** 是否為訪客 */
  isGuest?: boolean;
}

/** 使用者公開資訊（對戰時顯示） */
export interface PublicUserInfo {
  id: string;
  username: string;       // 帳號
  displayName: string;    // 顯示名稱
  rating: number;
  rank: Rank;
  wins: number;
  losses: number;
  /** 是否為訪客 */
  isGuest?: boolean;
}

/** 對戰歷史記錄 */
export interface MatchHistory {
  id: string;
  gameId: string;
  opponentId: string;
  opponentUsername: string;
  result: "win" | "loss" | "draw";
  ratingChange: number;
  playedAt: number;
  /** 使用的棋子顏色 */
  color: "black" | "white";
  /** 總步數 */
  totalMoves: number;
}

/** 登入請求 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 註冊請求 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/** 認證回應 */
export interface AuthResponse {
  user: User;
  token: string;
}
