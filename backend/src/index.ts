/**
 * 五子棋對戰平台 - WebSocket 伺服器入口
 * 
 * 負責初始化 Socket.IO 伺服器和相關服務
 */

import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// 載入環境變數（必須在其他導入之前）
dotenv.config();

// 全域錯誤處理
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// 延遲導入服務（避免 Prisma 初始化錯誤導致整個應用崩潰）
import { RoomService, MatchmakingService } from "./services";
import { SocketHandler } from "./handlers";

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// 解析 CORS 來源（支援多個來源，用逗號分隔）
function parseCorsOrigin(origin: string): string | string[] | boolean {
  if (origin === "*") {
    return true; // 允許所有來源
  }
  
  // 確保有 https:// 前綴
  const addProtocol = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };
  
  if (origin.includes(",")) {
    return origin.split(",").map(o => addProtocol(o));
  }
  return addProtocol(origin);
}

/**
 * 初始化伺服器
 */
function initServer(): void {
  // 建立 HTTP 伺服器，加入健康檢查端點
  const httpServer = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        service: "gomoku-backend",
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  // 建立 Socket.IO 伺服器
  const io = new Server(httpServer, {
    cors: {
      origin: parseCorsOrigin(CORS_ORIGIN),
      methods: ["GET", "POST"],
      credentials: CORS_ORIGIN !== "*", // 使用 * 時不能有 credentials
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

  // 啟動伺服器 - 綁定到 0.0.0.0 以支援雲端平台
  httpServer.listen(Number(PORT), "0.0.0.0", () => {
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
