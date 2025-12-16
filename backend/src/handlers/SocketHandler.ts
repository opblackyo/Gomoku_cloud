/**
 * WebSocket 事件處理器
 * 
 * 處理所有客戶端與伺服器之間的即時通訊
 */

import { Server, Socket } from "socket.io";
import { 
  RoomService, 
  MatchmakingService, 
  GameService,
  authService
} from "../services";
import { 
  PublicUserInfo, 
  Position, 
  StoneColor,
  Room,
  GameResult,
  Rank
} from "../types";

/**
 * Socket 處理器類
 * 
 * 遵循依賴反轉原則，透過建構函數注入服務
 */
export class SocketHandler {
  private io: Server;
  private roomService: RoomService;
  private matchmakingService: MatchmakingService;
  
  /** 連線玩家資訊映射 */
  private connectedUsers: Map<string, {
    user: PublicUserInfo;
    currentRoomId?: string;
  }> = new Map();

  /** 房間計時器映射 */
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    io: Server,
    roomService: RoomService,
    matchmakingService: MatchmakingService
  ) {
    this.io = io;
    this.roomService = roomService;
    this.matchmakingService = matchmakingService;
  }

  /**
   * 處理新連線
   */
  handleConnection(socket: Socket): void {
    console.log(`[Socket] New connection: ${socket.id}`);

    // 註冊事件處理器
    this.registerAuthEvents(socket);
    this.registerLobbyEvents(socket);
    this.registerRoomEvents(socket);
    this.registerMatchmakingEvents(socket);
    this.registerGameEvents(socket);
    this.registerChatEvents(socket);

    // 處理斷線
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  /**
   * 註冊認證事件
   */
  private registerAuthEvents(socket: Socket): void {
    // 註冊
    socket.on("auth:register", async (data: { username: string; password: string; displayName?: string }) => {
      try {
        const result = await authService.register(data.username, data.password, data.displayName);
        socket.emit("auth:register_result", result);
        
        if (result.success && result.user) {
          // 自動登入並加入連線用戶
          this.connectedUsers.set(socket.id, { user: result.user });
          console.log(`[Auth] User registered and connected: ${result.user.username}`);
        }
      } catch (error) {
        console.error("[Auth] Register error:", error);
        socket.emit("auth:register_result", { success: false, message: "註冊失敗" });
      }
    });

    // 登入
    socket.on("auth:login", async (data: { username: string; password: string }) => {
      try {
        const result = await authService.login(data.username, data.password);
        socket.emit("auth:login_result", result);
        
        if (result.success && result.user) {
          // 更新連線用戶資訊
          this.connectedUsers.set(socket.id, { user: result.user });
          console.log(`[Auth] User logged in: ${result.user.username}`);
        }
      } catch (error) {
        console.error("[Auth] Login error:", error);
        socket.emit("auth:login_result", { success: false, message: "登入失敗" });
      }
    });

    // Token 驗證（恢復登入狀態）
    socket.on("auth:verify", async (token: string) => {
      try {
        const result = await authService.verifyToken(token);
        socket.emit("auth:verify_result", result);
        
        if (result.success && result.user) {
          // 恢復用戶連線狀態
          this.connectedUsers.set(socket.id, { user: result.user });
          console.log(`[Auth] User session restored: ${result.user.username}`);
        }
      } catch (error) {
        console.error("[Auth] Verify error:", error);
        socket.emit("auth:verify_result", { success: false, message: "驗證失敗" });
      }
    });

    // 更新顯示名稱
    socket.on("auth:update_display_name", async (newDisplayName: string) => {
      try {
        const userData = this.connectedUsers.get(socket.id);
        if (!userData || userData.user.isGuest) {
          socket.emit("auth:update_display_name_result", { success: false, message: "請先登入" });
          return;
        }

        const result = await authService.updateDisplayName(userData.user.id, newDisplayName);
        socket.emit("auth:update_display_name_result", result);

        if (result.success && result.user) {
          // 更新連線用戶資訊
          this.connectedUsers.set(socket.id, { user: result.user });
          console.log(`[Auth] Display name updated: ${result.user.displayName}`);
        }
      } catch (error) {
        console.error("[Auth] Update display name error:", error);
        socket.emit("auth:update_display_name_result", { success: false, message: "更新失敗" });
      }
    });

    // 登出
    socket.on("auth:logout", () => {
      const userData = this.connectedUsers.get(socket.id);
      if (userData) {
        console.log(`[Auth] User logged out: ${userData.user.username}`);
        // 保留連線但重置為訪客
        const guestUser: PublicUserInfo = {
          id: `guest_${socket.id}`,
          username: `guest_${socket.id.slice(0, 6)}`,
          displayName: `訪客_${socket.id.slice(0, 6)}`,
          rating: 1000,
          rank: "bronze",
          wins: 0,
          losses: 0,
          isGuest: true,
        };
        this.connectedUsers.set(socket.id, { user: guestUser });
      }
      socket.emit("auth:logout_result", { success: true });
    });
  }

  /**
   * 註冊大廳事件
   */
  private registerLobbyEvents(socket: Socket): void {
    // 加入大廳
    socket.on("lobby:join", (userId: string) => {
      console.log(`[Lobby] User ${userId} joined lobby`);
      
      // 建立臨時使用者資訊（實際應從資料庫獲取）
      const guestName = `Player_${userId.slice(0, 6)}`;
      const user: PublicUserInfo = {
        id: userId,
        username: guestName,
        displayName: guestName,
        rating: 1000,
        rank: "bronze",
        wins: 0,
        losses: 0,
        isGuest: true,
      };

      this.connectedUsers.set(socket.id, { user });
      socket.join("lobby");

      // 發送房間列表
      const rooms = this.roomService.getRoomList();
      socket.emit("lobby:rooms_update", rooms);
      socket.emit("connection:success", { userId: socket.id });
    });

    // 離開大廳
    socket.on("lobby:leave", () => {
      socket.leave("lobby");
    });
  }

  /**
   * 註冊房間事件
   */
  private registerRoomEvents(socket: Socket): void {
    // 建立房間
    socket.on("room:create", (data: {
      name: string;
      type: "public" | "private";
      password?: string;
      config: {
        allowSpectators: boolean;
        turnTimeLimit: number;
        allowUndo: boolean;
      };
    }) => {
      try {
        const userData = this.connectedUsers.get(socket.id);
        if (!userData) {
          socket.emit("error", { code: "NOT_CONNECTED", message: "Please join lobby first" });
          return;
        }

        const room = this.roomService.createRoom(
          data.name,
          data.type,
          { ...data.config, password: data.password },
          userData.user,
          socket.id
        );

        userData.currentRoomId = room.id;
        socket.join(`room:${room.id}`);
        socket.leave("lobby");

        socket.emit("room:created", this.sanitizeRoom(room));
        
        // 更新大廳房間列表
        this.broadcastRoomList();

        console.log(`[Room] Created: ${room.id} by ${userData.user.username}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create room";
        socket.emit("error", { code: "CREATE_ROOM_FAILED", message });
      }
    });

    // 加入房間
    socket.on("room:join", (data: { roomId: string; password?: string }) => {
      try {
        const userData = this.connectedUsers.get(socket.id);
        if (!userData) {
          socket.emit("error", { code: "NOT_CONNECTED", message: "Please join lobby first" });
          return;
        }

        const room = this.roomService.joinRoom(
          data.roomId,
          userData.user,
          socket.id,
          data.password
        );

        userData.currentRoomId = room.id;
        socket.join(`room:${room.id}`);
        socket.leave("lobby");

        // 通知房間內所有人
        socket.emit("room:joined", this.sanitizeRoom(room));
        socket.to(`room:${room.id}`).emit("room:player_joined", userData.user);

        // 更新大廳房間列表
        this.broadcastRoomList();

        // 如果雙方都準備好了，可以開始遊戲
        if (room.status === "ready") {
          this.startGameInRoom(room);
        }

        console.log(`[Room] ${userData.user.username} joined ${room.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to join room";
        socket.emit("error", { code: "JOIN_ROOM_FAILED", message });
      }
    });

    // 離開房間
    socket.on("room:leave", (roomId: string) => {
      this.handleLeaveRoom(socket, roomId);
    });
  }

  /**
   * 註冊匹配事件
   */
  private registerMatchmakingEvents(socket: Socket): void {
    // 開始匹配
    socket.on("matchmaking:start", () => {
      try {
        const userData = this.connectedUsers.get(socket.id);
        if (!userData) {
          socket.emit("error", { code: "NOT_CONNECTED", message: "Please join lobby first" });
          return;
        }

        this.matchmakingService.joinQueue(socket.id, userData.user);
        socket.emit("matchmaking:status", { 
          isSearching: true,
          estimatedWaitTime: this.matchmakingService.getEstimatedWaitTime(socket.id)
        });

        // 嘗試立即匹配
        this.tryMatch(socket.id);

        console.log(`[Matchmaking] ${userData.user.username} started searching`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start matchmaking";
        socket.emit("error", { code: "MATCHMAKING_FAILED", message });
      }
    });

    // 取消匹配
    socket.on("matchmaking:cancel", () => {
      this.matchmakingService.leaveQueue(socket.id);
      socket.emit("matchmaking:status", { isSearching: false });
      console.log(`[Matchmaking] ${socket.id} cancelled search`);
    });
  }

  /**
   * 註冊遊戲事件
   */
  private registerGameEvents(socket: Socket): void {
    // 落子
    socket.on("game:move", (data: { roomId: string; position: Position }) => {
      try {
        const room = this.roomService.getRoom(data.roomId);
        if (!room || !room.currentGame) {
          socket.emit("error", { code: "GAME_NOT_FOUND", message: "Game not found" });
          return;
        }

        const playerColor = this.roomService.getPlayerColor(room, socket.id);
        if (!playerColor) {
          socket.emit("error", { code: "NOT_PLAYER", message: "You are not a player" });
          return;
        }

        const { game, result } = GameService.makeMove(
          room.currentGame,
          data.position,
          playerColor
        );

        room.currentGame = game;

        // 廣播落子
        const move = game.moves[game.moves.length - 1];
        this.io.to(`room:${data.roomId}`).emit("game:move_made", move);

        // 如果遊戲結束
        if (result) {
          this.stopRoomTimer(data.roomId);
          room.status = "finished";
          this.updatePlayerStats(room, result);
          this.io.to(`room:${data.roomId}`).emit("game:end", result);
        } else {
          // 重置回合時間
          room.currentGame.turnTimeRemaining = room.currentGame.turnTimeLimit;
          
          // 更新回合資訊
          this.io.to(`room:${data.roomId}`).emit("game:turn_update", {
            currentTurn: game.currentTurn,
            timeRemaining: game.turnTimeRemaining,
          });
        }

        console.log(`[Game] Move at (${data.position.x}, ${data.position.y}) in room ${data.roomId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid move";
        socket.emit("error", { code: "INVALID_MOVE", message });
      }
    });

    // 悔棋請求
    socket.on("game:undo_request", (roomId: string) => {
      const room = this.roomService.getRoom(roomId);
      if (!room) return;

      const userData = this.connectedUsers.get(socket.id);
      socket.to(`room:${roomId}`).emit("game:undo_requested", { 
        requesterId: userData?.user.id 
      });
    });

    // 悔棋回應
    socket.on("game:undo_response", (data: { roomId: string; accepted: boolean }) => {
      const room = this.roomService.getRoom(data.roomId);
      if (!room || !room.currentGame) return;

      let removedMoves = undefined;
      if (data.accepted) {
        // 先保存要移除的步數
        const movesToRemove = Math.min(2, room.currentGame.moves.length);
        removedMoves = room.currentGame.moves.slice(-movesToRemove);
        // 悔棋兩步（雙方各一步）
        room.currentGame = GameService.undoMoves(room.currentGame, movesToRemove);
      }

      this.io.to(`room:${data.roomId}`).emit("game:undo_result", {
        accepted: data.accepted,
        removedMoves: removedMoves,
      });
    });

    // 投降
    socket.on("game:surrender", (roomId: string) => {
      const room = this.roomService.getRoom(roomId);
      if (!room || !room.currentGame) return;

      const playerColor = this.roomService.getPlayerColor(room, socket.id);
      if (!playerColor) return;

      const { game, result } = GameService.handleSurrender(room.currentGame, playerColor);
      room.currentGame = game;
      room.status = "finished";

      this.stopRoomTimer(roomId);
      this.updatePlayerStats(room, result);
      this.io.to(`room:${roomId}`).emit("game:end", result);
    });

    // 再來一局請求
    socket.on("game:rematch_request", (roomId: string) => {
      const userData = this.connectedUsers.get(socket.id);
      socket.to(`room:${roomId}`).emit("game:rematch_requested", {
        requesterId: userData?.user.id,
      });
    });

    // 再來一局回應
    socket.on("game:rematch_response", (data: { roomId: string; accepted: boolean }) => {
      if (data.accepted) {
        const room = this.roomService.resetRoomForRematch(data.roomId);
        if (room) {
          this.startGameInRoom(room);
        }
      }

      this.io.to(`room:${data.roomId}`).emit("game:rematch_result", {
        accepted: data.accepted,
      });
    });
  }

  /**
   * 註冊聊天事件
   */
  private registerChatEvents(socket: Socket): void {
    // 發送聊天訊息
    socket.on("chat:message", (data: { roomId: string; content: string }) => {
      const userData = this.connectedUsers.get(socket.id);
      if (!userData) return;

      this.io.to(`room:${data.roomId}`).emit("chat:message_received", {
        senderId: userData.user.id,
        senderName: userData.user.username,
        content: data.content,
        timestamp: Date.now(),
      });
    });

    // 發送表情
    socket.on("chat:emoji", (data: { roomId: string; emoji: string }) => {
      const userData = this.connectedUsers.get(socket.id);
      if (!userData) return;

      this.io.to(`room:${data.roomId}`).emit("chat:emoji_received", {
        senderId: userData.user.id,
        emoji: data.emoji,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * 處理斷線
   */
  private handleDisconnect(socket: Socket): void {
    console.log(`[Socket] Disconnected: ${socket.id}`);

    const userData = this.connectedUsers.get(socket.id);
    
    // 離開匹配隊列
    this.matchmakingService.leaveQueue(socket.id);

    // 處理房間離開
    if (userData?.currentRoomId) {
      this.handleLeaveRoom(socket, userData.currentRoomId, true);
    }

    this.connectedUsers.delete(socket.id);
  }

  /**
   * 處理離開房間
   */
  private handleLeaveRoom(socket: Socket, roomId: string, isDisconnect = false): void {
    const room = this.roomService.getRoom(roomId);
    if (!room) return;

    // 如果遊戲進行中，處理為斷線判負
    if (room.currentGame && room.status === "playing" && isDisconnect) {
      const playerColor = this.roomService.getPlayerColor(room, socket.id);
      if (playerColor) {
        const { result } = GameService.handleDisconnect(room.currentGame, playerColor);
        this.io.to(`room:${roomId}`).emit("game:end", result);
      }
    }

    const { room: updatedRoom, wasHost, wasGuest } = this.roomService.leaveRoom(roomId, socket.id);
    
    socket.leave(`room:${roomId}`);

    if (updatedRoom) {
      socket.to(`room:${roomId}`).emit("room:player_left", socket.id);
      socket.to(`room:${roomId}`).emit("room:status_update", { 
        roomId, 
        status: updatedRoom.status 
      });
    }

    // 更新玩家狀態
    const userData = this.connectedUsers.get(socket.id);
    if (userData) {
      userData.currentRoomId = undefined;
    }

    // 更新大廳房間列表
    this.broadcastRoomList();

    console.log(`[Room] ${socket.id} left ${roomId}`);
  }

  /**
   * 嘗試匹配
   */
  private tryMatch(socketId: string): void {
    const match = this.matchmakingService.findMatch(socketId);
    if (!match) return;

    const [player1, player2] = match;

    // 建立匹配房間
    const room = this.roomService.createRoom(
      `Match: ${player1.user.username} vs ${player2.user.username}`,
      "public",
      { allowSpectators: true, turnTimeLimit: 60, allowUndo: false },
      player1.user,
      player1.socketId
    );

    // 加入第二個玩家
    this.roomService.joinRoom(room.id, player2.user, player2.socketId);

    // 更新玩家狀態
    const user1Data = this.connectedUsers.get(player1.socketId);
    const user2Data = this.connectedUsers.get(player2.socketId);
    if (user1Data) user1Data.currentRoomId = room.id;
    if (user2Data) user2Data.currentRoomId = room.id;

    // 加入房間頻道
    const socket1 = this.io.sockets.sockets.get(player1.socketId);
    const socket2 = this.io.sockets.sockets.get(player2.socketId);
    socket1?.join(`room:${room.id}`);
    socket2?.join(`room:${room.id}`);
    socket1?.leave("lobby");
    socket2?.leave("lobby");

    // 通知雙方
    socket1?.emit("matchmaking:found", this.sanitizeRoom(room));
    socket2?.emit("matchmaking:found", this.sanitizeRoom(room));

    // 開始遊戲
    this.startGameInRoom(room);

    console.log(`[Matchmaking] Match found: ${player1.user.username} vs ${player2.user.username}`);
  }

  /**
   * 在房間中開始遊戲
   */
  private startGameInRoom(room: Room): void {
    const startedRoom = this.roomService.startGame(room.id);
    if (!startedRoom || !startedRoom.currentGame) return;

    const hostColor: StoneColor = "black";
    const guestColor: StoneColor = "white";

    // 通知房主
    const hostSocket = this.io.sockets.sockets.get(startedRoom.hostSocketId);
    hostSocket?.emit("game:start", {
      gameId: startedRoom.currentGame.id,
      roomId: room.id,
      yourColor: hostColor,
      opponent: startedRoom.guest,
      firstMove: "black",
    });

    // 通知對手
    if (startedRoom.guestSocketId) {
      const guestSocket = this.io.sockets.sockets.get(startedRoom.guestSocketId);
      guestSocket?.emit("game:start", {
        gameId: startedRoom.currentGame.id,
        roomId: room.id,
        yourColor: guestColor,
        opponent: startedRoom.host,
        firstMove: "black",
      });
    }

    // 啟動計時器
    this.startRoomTimer(room.id);

    // 更新大廳
    this.broadcastRoomList();

    console.log(`[Game] Started in room ${room.id}`);
  }

  /**
   * 處理匹配結果（由外部定時器調用）
   */
  handleMatch(player1: { socketId: string; user: PublicUserInfo }, player2: { socketId: string; user: PublicUserInfo }): void {
    // 建立匹配房間
    const room = this.roomService.createRoom(
      `Match: ${player1.user.username} vs ${player2.user.username}`,
      "public",
      { allowSpectators: true, turnTimeLimit: 60, allowUndo: false },
      player1.user,
      player1.socketId
    );

    // 加入第二個玩家
    this.roomService.joinRoom(room.id, player2.user, player2.socketId);

    // 更新玩家狀態
    const user1Data = this.connectedUsers.get(player1.socketId);
    const user2Data = this.connectedUsers.get(player2.socketId);
    if (user1Data) user1Data.currentRoomId = room.id;
    if (user2Data) user2Data.currentRoomId = room.id;

    // 加入房間頻道
    const socket1 = this.io.sockets.sockets.get(player1.socketId);
    const socket2 = this.io.sockets.sockets.get(player2.socketId);
    socket1?.join(`room:${room.id}`);
    socket2?.join(`room:${room.id}`);
    socket1?.leave("lobby");
    socket2?.leave("lobby");

    // 通知雙方匹配成功
    socket1?.emit("matchmaking:found", this.sanitizeRoom(room));
    socket2?.emit("matchmaking:found", this.sanitizeRoom(room));

    // 開始遊戲
    this.startGameInRoom(room);

    console.log(`[Matchmaking] Timer match: ${player1.user.username} vs ${player2.user.username}`);
  }

  /**
   * 廣播房間列表到大廳
   */
  private broadcastRoomList(): void {
    const rooms = this.roomService.getRoomList();
    this.io.to("lobby").emit("lobby:rooms_update", rooms);
  }

  /**
   * 計算新段位
   */
  private calculateRank(rating: number): Rank {
    if (rating >= 2400) return "apex";
    if (rating >= 2100) return "master";
    if (rating >= 1800) return "diamond";
    if (rating >= 1500) return "platinum";
    if (rating >= 1200) return "gold";
    if (rating >= 900) return "silver";
    return "bronze";
  }

  /**
   * 更新遊戲結束後的玩家統計
   */
  private async updatePlayerStats(room: Room, result: GameResult): Promise<void> {
    const hostSocketId = room.hostSocketId;
    const guestSocketId = room.guestSocketId;

    if (!hostSocketId || !guestSocketId) return;

    const hostData = this.connectedUsers.get(hostSocketId);
    const guestData = this.connectedUsers.get(guestSocketId);

    if (!hostData || !guestData) return;

    // 計算積分變化 (簡單 ELO)
    const K = 32; // ELO K 係數
    const hostRating = hostData.user.rating;
    const guestRating = guestData.user.rating;
    
    const expectedHost = 1 / (1 + Math.pow(10, (guestRating - hostRating) / 400));
    const expectedGuest = 1 - expectedHost;

    let hostScore: number;
    let guestScore: number;

    // Host 是黑子，Guest 是白子
    if (result.winner === "black") {
      hostScore = 1;
      guestScore = 0;
      hostData.user.wins++;
      guestData.user.losses++;
    } else if (result.winner === "white") {
      hostScore = 0;
      guestScore = 1;
      hostData.user.losses++;
      guestData.user.wins++;
    } else {
      hostScore = 0.5;
      guestScore = 0.5;
    }

    // 更新積分
    const hostRatingChange = Math.round(K * (hostScore - expectedHost));
    const guestRatingChange = Math.round(K * (guestScore - expectedGuest));

    hostData.user.rating = Math.max(0, hostData.user.rating + hostRatingChange);
    guestData.user.rating = Math.max(0, guestData.user.rating + guestRatingChange);

    // 更新段位
    hostData.user.rank = this.calculateRank(hostData.user.rating);
    guestData.user.rank = this.calculateRank(guestData.user.rating);

    // 如果是已登入用戶（非訪客），更新資料庫
    if (!hostData.user.isGuest && hostData.user.id) {
      try {
        await authService.updateUserStats(
          hostData.user.id,
          hostData.user.rating,
          hostData.user.wins,
          hostData.user.losses
        );
        console.log(`[Stats] Database updated for ${hostData.user.username}`);
      } catch (error) {
        console.error(`[Stats] Failed to update database for ${hostData.user.username}:`, error);
      }
    }

    if (!guestData.user.isGuest && guestData.user.id) {
      try {
        await authService.updateUserStats(
          guestData.user.id,
          guestData.user.rating,
          guestData.user.wins,
          guestData.user.losses
        );
        console.log(`[Stats] Database updated for ${guestData.user.username}`);
      } catch (error) {
        console.error(`[Stats] Failed to update database for ${guestData.user.username}:`, error);
      }
    }

    // 發送統計更新給玩家
    const hostSocket = this.io.sockets.sockets.get(hostSocketId);
    const guestSocket = this.io.sockets.sockets.get(guestSocketId);

    hostSocket?.emit("player:stats_update", {
      rating: hostData.user.rating,
      ratingChange: hostRatingChange,
      wins: hostData.user.wins,
      losses: hostData.user.losses,
      rank: hostData.user.rank,
    });

    guestSocket?.emit("player:stats_update", {
      rating: guestData.user.rating,
      ratingChange: guestRatingChange,
      wins: guestData.user.wins,
      losses: guestData.user.losses,
      rank: guestData.user.rank,
    });

    console.log(`[Stats] Updated: ${hostData.user.username} (${hostRatingChange > 0 ? '+' : ''}${hostRatingChange}) vs ${guestData.user.username} (${guestRatingChange > 0 ? '+' : ''}${guestRatingChange})`);
  }

  /**
   * 啟動房間計時器
   */
  private startRoomTimer(roomId: string): void {
    // 清除舊計時器
    this.stopRoomTimer(roomId);

    const timer = setInterval(() => {
      const room = this.roomService.getRoom(roomId);
      if (!room || !room.currentGame || room.status !== "playing") {
        this.stopRoomTimer(roomId);
        return;
      }

      // 減少時間
      room.currentGame.turnTimeRemaining--;

      // 廣播時間更新
      this.io.to(`room:${roomId}`).emit("game:turn_update", {
        currentTurn: room.currentGame.currentTurn,
        timeRemaining: room.currentGame.turnTimeRemaining,
      });

      // 檢查超時
      if (room.currentGame.turnTimeRemaining <= 0) {
        this.stopRoomTimer(roomId);
        
        // 超時判負
        const loser = room.currentGame.currentTurn;
        const winner = loser === "black" ? "white" : "black";
        
        const result: GameResult = {
          winner,
          reason: "timeout",
        };

        room.currentGame.status = "finished";
        room.currentGame.result = result;
        room.status = "finished";

        this.updatePlayerStats(room, result);
        this.io.to(`room:${roomId}`).emit("game:end", result);
      }
    }, 1000);

    this.roomTimers.set(roomId, timer);
  }

  /**
   * 停止房間計時器
   */
  private stopRoomTimer(roomId: string): void {
    const timer = this.roomTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.roomTimers.delete(roomId);
    }
  }

  /**
   * 移除敏感資訊的房間資料
   */
  private sanitizeRoom(room: Room): Omit<Room, "spectators"> & { spectators: PublicUserInfo[] } {
    return {
      ...room,
      config: {
        ...room.config,
        password: undefined, // 移除密碼
      },
      spectators: Array.from(room.spectators.values()),
    };
  }
}
