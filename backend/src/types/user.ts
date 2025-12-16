/**
 * 使用者與帳號系統型別定義
 */

/** 段位等級 */
export type Rank = 
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "apex";

/** 使用者基本資訊 */
export interface User {
  id: string;
  username: string;      // 帳號（用於登入，不可修改）
  displayName: string;   // 顯示名稱（可修改）
  email: string;
  rating: number;
  rank: Rank;
  wins: number;
  losses: number;
  draws: number;
  createdAt: number;
  lastLoginAt: number;
}

/** 使用者公開資訊 */
export interface PublicUserInfo {
  id: string;
  username: string;      // 帳號
  displayName: string;   // 顯示名稱
  rating: number;
  rank: Rank;
  wins: number;
  losses: number;
  isGuest?: boolean;     // 是否為訪客
}

/** 連線中的玩家 */
export interface ConnectedPlayer {
  socketId: string;
  user: PublicUserInfo;
  currentRoomId?: string;
  isInMatchmaking: boolean;
  connectedAt: number;
}
