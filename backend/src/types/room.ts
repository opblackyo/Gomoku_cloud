/**
 * 房間與匹配系統型別定義
 */

import { PublicUserInfo } from "./user";
import { Game } from "./game";

/** 房間類型 */
export type RoomType = "public" | "private";

/** 房間狀態 */
export type RoomStatus = 
  | "waiting"
  | "ready"
  | "playing"
  | "finished";

/** 房間配置 */
export interface RoomConfig {
  allowSpectators: boolean;
  turnTimeLimit: number;
  allowUndo: boolean;
  password?: string;
}

/** 房間實例 */
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  config: RoomConfig;
  host: PublicUserInfo;
  hostSocketId: string;
  guest?: PublicUserInfo;
  guestSocketId?: string;
  spectators: Map<string, PublicUserInfo>;
  currentGame?: Game;
  createdAt: number;
}

/** 房間列表項目 */
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

/** 匹配隊列項目 */
export interface MatchmakingEntry {
  socketId: string;
  user: PublicUserInfo;
  joinedAt: number;
  ratingRange: {
    min: number;
    max: number;
  };
}
