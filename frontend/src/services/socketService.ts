/**
 * WebSocket 客戶端服務
 * 
 * 封裝 Socket.IO 客戶端，提供統一的連線管理
 */

import { io, Socket } from "socket.io-client";
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  RoomListItem,
  Room,
  Move,
  GameResult,
  PublicUserInfo,
  StoneColor,
  Position,
} from "@/types";

/** Socket 實例類型 */
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * WebSocket 連線管理類
 * 
 * 採用單例模式，確保全局只有一個連線
 */
class SocketService {
  private socket: TypedSocket | null = null;
  private isConnecting = false;

  /**
   * 獲取 WebSocket 伺服器 URL
   */
  private getServerUrl(): string {
    // 支援多種環境變數名稱
    return process.env.NEXT_PUBLIC_SOCKET_URL || 
           process.env.NEXT_PUBLIC_WS_URL || 
           "http://localhost:3001";
  }

  /**
   * 連線到伺服器
   */
  connect(): Promise<TypedSocket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // 等待現有連線完成
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve(this.socket);
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      const serverUrl = this.getServerUrl();
      console.log(`[Socket] Connecting to ${serverUrl}...`);

      this.socket = io(serverUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("[Socket] Connected:", this.socket?.id);
        this.isConnecting = false;
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
      });
    });
  }

  /**
   * 斷開連線
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 獲取當前 Socket 實例
   */
  getSocket(): TypedSocket | null {
    return this.socket;
  }

  /**
   * 檢查是否已連線
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ========== 認證相關方法 ==========

  /**
   * 註冊
   */
  register(username: string, password: string, displayName?: string): void {
    this.socket?.emit("auth:register", { username, password, displayName });
  }

  /**
   * 登入
   */
  login(username: string, password: string): void {
    this.socket?.emit("auth:login", { username, password });
  }

  /**
   * 驗證 Token
   */
  verifyToken(token: string): void {
    this.socket?.emit("auth:verify", token);
  }

  /**
   * 登出
   */
  logout(): void {
    this.socket?.emit("auth:logout");
  }

  /**
   * 更新顯示名稱
   */
  updateDisplayName(newDisplayName: string): void {
    this.socket?.emit("auth:update_display_name", newDisplayName);
  }

  /**
   * 監聯註冊結果
   */
  onRegisterResult(callback: (result: { success: boolean; message: string; user?: PublicUserInfo; token?: string }) => void): void {
    this.socket?.on("auth:register_result", callback);
  }

  /**
   * 監聽登入結果
   */
  onLoginResult(callback: (result: { success: boolean; message: string; user?: PublicUserInfo; token?: string }) => void): void {
    this.socket?.on("auth:login_result", callback);
  }

  /**
   * 監聽 Token 驗證結果
   */
  onVerifyResult(callback: (result: { success: boolean; message: string; user?: PublicUserInfo }) => void): void {
    this.socket?.on("auth:verify_result", callback);
  }

  /**
   * 監聽登出結果
   */
  onLogoutResult(callback: (result: { success: boolean }) => void): void {
    this.socket?.on("auth:logout_result", callback);
  }

  /**
   * 監聽更新名稱結果
   */
  onUpdateDisplayNameResult(callback: (result: { success: boolean; message: string; user?: PublicUserInfo }) => void): void {
    this.socket?.on("auth:update_display_name_result", callback);
  }

  // ========== 大廳相關方法 ==========

  /**
   * 加入大廳
   */
  joinLobby(userId: string): void {
    this.socket?.emit("lobby:join", userId);
  }

  /**
   * 離開大廳
   */
  leaveLobby(): void {
    this.socket?.emit("lobby:leave");
  }

  /**
   * 監聽房間列表更新
   */
  onRoomsUpdate(callback: (rooms: RoomListItem[]) => void): void {
    this.socket?.on("lobby:rooms_update", callback);
  }

  // ========== 房間相關方法 ==========

  /**
   * 建立房間
   */
  createRoom(data: {
    name: string;
    type: "public" | "private";
    password?: string;
    config: {
      allowSpectators: boolean;
      turnTimeLimit: number;
      allowUndo: boolean;
    };
  }): void {
    this.socket?.emit("room:create", data);
  }

  /**
   * 加入房間
   */
  joinRoom(roomId: string, password?: string): void {
    this.socket?.emit("room:join", { roomId, password });
  }

  /**
   * 離開房間
   */
  leaveRoom(roomId: string): void {
    this.socket?.emit("room:leave", roomId);
  }

  /**
   * 監聽房間事件
   */
  onRoomCreated(callback: (room: Room) => void): void {
    this.socket?.on("room:created", callback);
  }

  onRoomJoined(callback: (room: Room) => void): void {
    this.socket?.on("room:joined", callback);
  }

  onPlayerJoined(callback: (player: PublicUserInfo) => void): void {
    this.socket?.on("room:player_joined", callback);
  }

  onPlayerLeft(callback: (playerId: string) => void): void {
    this.socket?.on("room:player_left", callback);
  }

  // ========== 匹配相關方法 ==========

  /**
   * 開始匹配
   */
  startMatchmaking(): void {
    this.socket?.emit("matchmaking:start");
  }

  /**
   * 取消匹配
   */
  cancelMatchmaking(): void {
    this.socket?.emit("matchmaking:cancel");
  }

  /**
   * 監聽匹配事件
   */
  onMatchFound(callback: (room: Room) => void): void {
    this.socket?.on("matchmaking:found", callback);
  }

  onMatchmakingStatus(callback: (status: { isSearching: boolean; estimatedWaitTime?: number }) => void): void {
    this.socket?.on("matchmaking:status", callback);
  }

  // ========== 遊戲相關方法 ==========

  /**
   * 落子
   */
  makeMove(roomId: string, position: Position): void {
    this.socket?.emit("game:move", { roomId, position });
  }

  /**
   * 請求悔棋
   */
  requestUndo(roomId: string): void {
    this.socket?.emit("game:undo_request", roomId);
  }

  /**
   * 回應悔棋
   */
  respondUndo(roomId: string, accepted: boolean): void {
    this.socket?.emit("game:undo_response", { roomId, accepted });
  }

  /**
   * 投降
   */
  surrender(roomId: string): void {
    this.socket?.emit("game:surrender", roomId);
  }

  /**
   * 請求再來一局
   */
  requestRematch(roomId: string): void {
    this.socket?.emit("game:rematch_request", roomId);
  }

  /**
   * 回應再來一局
   */
  respondRematch(roomId: string, accepted: boolean): void {
    this.socket?.emit("game:rematch_response", { roomId, accepted });
  }

  /**
   * 監聽遊戲事件
   */
  onGameStart(callback: (data: {
    gameId: string;
    roomId: string;
    yourColor: StoneColor;
    opponent: PublicUserInfo;
    firstMove: StoneColor;
  }) => void): void {
    this.socket?.on("game:start", callback);
  }

  onMoveMade(callback: (move: Move) => void): void {
    this.socket?.on("game:move_made", callback);
  }

  onTurnUpdate(callback: (data: { currentTurn: StoneColor; timeRemaining: number }) => void): void {
    this.socket?.on("game:turn_update", callback);
  }

  onGameEnd(callback: (result: GameResult) => void): void {
    this.socket?.on("game:end", callback);
  }

  onUndoRequested(callback: (data: { requesterId: string }) => void): void {
    this.socket?.on("game:undo_requested", callback);
  }

  onUndoResult(callback: (data: { accepted: boolean; removedMoves?: Move[] }) => void): void {
    this.socket?.on("game:undo_result", callback);
  }

  onRematchRequested(callback: (data: { requesterId: string }) => void): void {
    this.socket?.on("game:rematch_requested", callback);
  }

  onRematchResult(callback: (data: { accepted: boolean; newRoom?: Room }) => void): void {
    this.socket?.on("game:rematch_result", callback);
  }

  onStatsUpdate(callback: (data: {
    rating: number;
    ratingChange: number;
    wins: number;
    losses: number;
    rank: string;
  }) => void): void {
    this.socket?.on("player:stats_update", callback);
  }

  /**
   * 移除所有遊戲相關的監聽器
   */
  removeGameListeners(): void {
    this.socket?.off("game:start");
    this.socket?.off("game:move_made");
    this.socket?.off("game:turn_update");
    this.socket?.off("game:end");
    this.socket?.off("game:undo_requested");
    this.socket?.off("game:undo_result");
    this.socket?.off("game:rematch_requested");
    this.socket?.off("game:rematch_result");
    this.socket?.off("player:stats_update");
  }

  // ========== 聊天相關方法 ==========

  /**
   * 發送聊天訊息
   */
  sendMessage(roomId: string, content: string): void {
    this.socket?.emit("chat:message", { roomId, content });
  }

  /**
   * 發送表情
   */
  sendEmoji(roomId: string, emoji: string): void {
    this.socket?.emit("chat:emoji", { roomId, emoji });
  }

  /**
   * 監聽聊天事件
   */
  onMessageReceived(callback: (data: {
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
  }) => void): void {
    this.socket?.on("chat:message_received", callback);
  }

  onEmojiReceived(callback: (data: {
    senderId: string;
    emoji: string;
    timestamp: number;
  }) => void): void {
    this.socket?.on("chat:emoji_received", callback);
  }

  // ========== 錯誤處理 ==========

  /**
   * 監聽錯誤
   */
  onError(callback: (data: { code: string; message: string }) => void): void {
    this.socket?.on("error", callback);
  }

  /**
   * 移除所有監聽器
   */
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

// 匯出單例
export const socketService = new SocketService();
