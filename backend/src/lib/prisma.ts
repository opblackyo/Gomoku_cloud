/**
 * 資料庫客戶端
 * 
 * 統一管理 Prisma Client 實例，避免開發時創建多個連接
 */

import { PrismaClient } from "@prisma/client";

// 防止開發環境熱重載時創建多個 Prisma 實例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error);
  prismaInstance = null;
}

export const prisma = prismaInstance;

export default prisma;
