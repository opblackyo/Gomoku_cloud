/**
 * 房間與匹配系統型別定義
 */

import { PublicUserInfo } from "./user";
import { Game } from "./game";

/** 房間類型 */
export type RoomType = "public" | "private";

/** 房間狀態 */
export type RoomStatus = 
  | "waiting"     // 等待玩家加入
  | "ready"       // 雙方就緒
  | "playing"     // 遊戲進行中
  | "finished";   // 遊戲結束

/** 房間配置 */
export interface RoomConfig {
  /** 是否允許觀戰 */
  allowSpectators: boolean;
  /** 每步時限（秒） */
  turnTimeLimit: number;
  /** 是否允許悔棋 */
  allowUndo: boolean;
  /** 房間密碼（私人房間） */
  password?: string;
}

/** 房間實例 */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  config: RoomConfig;
  /** 房主 */
  host: PublicUserInfo;
  /** 對手（可能為空） */
  guest?: PublicUserInfo;
  /** 觀戰者列表 */
  spectators: PublicUserInfo[];
  /** 當前遊戲（如果正在進行） */
  currentGame?: Game;
  createdAt: number;
}

/** 房間列表項目（大廳顯示用） */
export interface RoomListItem {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  hostUsername: string;
  hostRating: number;
  hasPassword: boolean;
  spectatorCount: number;
  createdAt: number;
}

/** 建立房間請求 */
export interface CreateRoomRequest {
  name: string;
  type: RoomType;
  config: RoomConfig;
}

/** 加入房間請求 */
export interface JoinRoomRequest {
  roomId: string;
  password?: string;
}

/** 匹配請求 */
export interface MatchmakingRequest {
  userId: string;
  rating: number;
}

/** 匹配狀態 */
export interface MatchmakingStatus {
  isSearching: boolean;
  estimatedWaitTime?: number;
  searchStartedAt?: number;
}
