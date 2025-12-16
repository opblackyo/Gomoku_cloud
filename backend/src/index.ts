/**
 * 五子棋對戰平台 - WebSocket 伺服器入口
 * 
 * 負責初始化 Socket.IO 伺服器和相關服務
 */

import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import { RoomService, MatchmakingService } from "./services";
import { SocketHandler } from "./handlers";

// 載入環境變數
dotenv.config();

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

/**
 * 初始化伺服器
 */
function initServer(): void {
  // 建立 HTTP 伺服器
  const httpServer = createServer();

  // 建立 Socket.IO 伺服器
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // 連線設定
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 初始化服務
  const roomService = new RoomService();
  const matchmakingService = new MatchmakingService();

  // 初始化 Socket 處理器
  const socketHandler = new SocketHandler(io, roomService, matchmakingService);

  // 處理連線
  io.on("connection", (socket) => {
    socketHandler.handleConnection(socket);
  });

  // 啟動匹配處理定時器
  setInterval(() => {
    const matches = matchmakingService.processAllMatches();
    // 處理每個匹配結果
    for (const [player1, player2] of matches) {
      socketHandler.handleMatch(player1, player2);
    }
  }, 2000); // 每 2 秒檢查一次匹配

  // 啟動伺服器
  httpServer.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`🎮 五子棋對戰伺服器已啟動`);
    console.log(`📡 WebSocket 端口: ${PORT}`);
    console.log(`🌐 CORS 來源: ${CORS_ORIGIN}`);
    console.log(`⏰ 啟動時間: ${new Date().toLocaleString()}`);
    console.log("=".repeat(50));
  });

  // 優雅關閉
  process.on("SIGTERM", () => {
    console.log("\n🛑 收到關閉信號，正在優雅關閉...");
    
    io.close(() => {
      console.log("✅ Socket.IO 伺服器已關閉");
      httpServer.close(() => {
        console.log("✅ HTTP 伺服器已關閉");
        process.exit(0);
      });
    });
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 收到中斷信號，正在關閉...");
    process.exit(0);
  });
}

// 啟動伺服器
initServer();
