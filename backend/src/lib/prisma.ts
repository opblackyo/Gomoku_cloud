/**
 * 資料庫客戶端
 * 
 * 統一管理 Prisma Client 實例，避免開發時創建多個連接
 */

let PrismaClient: any;
try {
  PrismaClient = require("@prisma/client").PrismaClient;
} catch (error) {
  console.error("Failed to load Prisma Client module:", error);
  PrismaClient = null;
}

// 防止開發環境熱重載時創建多個 Prisma 實例
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

let prismaInstance: any | null = null;

if (PrismaClient) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
    console.log("✅ Prisma Client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Prisma Client:", error);
    prismaInstance = null;
  }
} else {
  console.warn("⚠️ Prisma Client not available - database features disabled");
}

export const prisma = prismaInstance;

export default prisma;
