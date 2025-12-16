/**
 * WebSocket 事件型別定義
 * 
 * 定義前後端即時通訊的所有事件
 */

import { Position, Move, GameResult, StoneColor } from "./game";
import { RoomListItem, Room } from "./room";
import { PublicUserInfo } from "./user";

/** 客戶端發送事件 */
export interface ClientToServerEvents {
  /** 註冊 */
  "auth:register": (data: { username: string; password: string; displayName?: string }) => void;
  
  /** 登入 */
  "auth:login": (data: { username: string; password: string }) => void;
  
  /** 驗證 Token */
  "auth:verify": (token: string) => void;
  
  /** 登出 */
  "auth:logout": () => void;
  
  /** 更新顯示名稱 */
  "auth:update_display_name": (newDisplayName: string) => void;
  
  /** 加入大廳 */
  "lobby:join": (userId: string) => void;
  
  /** 離開大廳 */
  "lobby:leave": () => void;
  
  /** 建立房間 */
  "room:create": (data: {
    name: string;
    type: "public" | "private";
    password?: string;
    config: {
      allowSpectators: boolean;
      turnTimeLimit: number;
      allowUndo: boolean;
    };
  }) => void;
  
  /** 加入房間 */
  "room:join": (data: { roomId: string; password?: string }) => void;
  
  /** 離開房間 */
  "room:leave": (roomId: string) => void;
  
  /** 開始隨機匹配 */
  "matchmaking:start": () => void;
  
  /** 取消匹配 */
  "matchmaking:cancel": () => void;
  
  /** 落子 */
  "game:move": (data: { roomId: string; position: Position }) => void;
  
  /** 請求悔棋 */
  "game:undo_request": (roomId: string) => void;
  
  /** 回應悔棋請求 */
  "game:undo_response": (data: { roomId: string; accepted: boolean }) => void;
  
  /** 投降 */
  "game:surrender": (roomId: string) => void;
  
  /** 請求再來一局 */
  "game:rematch_request": (roomId: string) => void;
  
  /** 回應再來一局 */
  "game:rematch_response": (data: { roomId: string; accepted: boolean }) => void;
  
  /** 發送聊天訊息 */
  "chat:message": (data: { roomId: string; content: string }) => void;
  
  /** 發送表情 */
  "chat:emoji": (data: { roomId: string; emoji: string }) => void;
}

/** 伺服器發送事件 */
export interface ServerToClientEvents {
  /** 連線成功 */
  "connection:success": (data: { userId: string }) => void;
  
  /** 註冊結果 */
  "auth:register_result": (result: { success: boolean; message: string; user?: PublicUserInfo; token?: string }) => void;
  
  /** 登入結果 */
  "auth:login_result": (result: { success: boolean; message: string; user?: PublicUserInfo; token?: string }) => void;
  
  /** Token 驗證結果 */
  "auth:verify_result": (result: { success: boolean; message: string; user?: PublicUserInfo }) => void;
  
  /** 登出結果 */
  "auth:logout_result": (result: { success: boolean }) => void;
  
  /** 更新顯示名稱結果 */
  "auth:update_display_name_result": (result: { success: boolean; message: string; user?: PublicUserInfo }) => void;
  
  /** 房間列表更新 */
  "lobby:rooms_update": (rooms: RoomListItem[]) => void;
  
  /** 房間建立成功 */
  "room:created": (room: Room) => void;
  
  /** 成功加入房間 */
  "room:joined": (room: Room) => void;
  
  /** 玩家加入房間通知 */
  "room:player_joined": (player: PublicUserInfo) => void;
  
  /** 玩家離開房間通知 */
  "room:player_left": (playerId: string) => void;
  
  /** 房間狀態更新 */
  "room:status_update": (data: { roomId: string; status: string }) => void;
  
  /** 匹配成功 */
  "matchmaking:found": (room: Room) => void;
  
  /** 匹配狀態更新 */
  "matchmaking:status": (data: { 
    isSearching: boolean; 
    estimatedWaitTime?: number 
  }) => void;
  
  /** 遊戲開始 */
  "game:start": (data: { 
    gameId: string;
    roomId: string;
    yourColor: StoneColor;
    opponent: PublicUserInfo;
    firstMove: StoneColor;
  }) => void;
  
  /** 落子通知 */
  "game:move_made": (move: Move) => void;
  
  /** 回合更新（包含時間） */
  "game:turn_update": (data: { 
    currentTurn: StoneColor; 
    timeRemaining: number 
  }) => void;
  
  /** 收到悔棋請求 */
  "game:undo_requested": (data: { requesterId: string }) => void;
  
  /** 悔棋結果 */
  "game:undo_result": (data: { 
    accepted: boolean; 
    removedMoves?: Move[] 
  }) => void;
  
  /** 遊戲結束 */
  "game:end": (result: GameResult) => void;
  
  /** 收到再來一局請求 */
  "game:rematch_requested": (data: { requesterId: string }) => void;
  
  /** 再來一局結果 */
  "game:rematch_result": (data: { accepted: boolean; newRoom?: Room }) => void;
  
  /** 收到聊天訊息 */
  "chat:message_received": (data: { 
    senderId: string; 
    senderName: string;
    content: string; 
    timestamp: number 
  }) => void;
  
  /** 收到表情 */
  "chat:emoji_received": (data: { 
    senderId: string; 
    emoji: string; 
    timestamp: number 
  }) => void;
  
  /** 錯誤通知 */
  "error": (data: { code: string; message: string }) => void;
}
