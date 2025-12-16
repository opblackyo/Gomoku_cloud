/**
 * 認證服務
 * 
 * 處理使用者註冊、登入、JWT 驗證等功能
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Rank, PublicUserInfo } from "../types";

/** JWT 負載類型 */
interface JwtPayload {
  userId: string;
  username: string;
}

/** 認證結果 */
interface AuthResult {
  success: boolean;
  message: string;
  user?: PublicUserInfo;
  token?: string;
}

/** 使用者詳細資訊（含密碼驗證用） */
interface UserWithPassword {
  id: string;
  username: string;
  password: string;
  rating: number;
  rank: string;
  wins: number;
  losses: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly saltRounds: number = 10;
  private readonly tokenExpiry: string = "7d";

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "default_secret_change_me";
    
    if (this.jwtSecret === "default_secret_change_me") {
      console.warn("[AuthService] Warning: Using default JWT secret. Set JWT_SECRET in production!");
    }
  }

  /**
   * 註冊新使用者
   */
  async register(username: string, password: string, displayName?: string): Promise<AuthResult> {
    try {
      // 檢查資料庫連接
      if (!prisma) {
        return { success: false, message: "資料庫服務暫時無法使用" };
      }

      // 驗證輸入
      if (!username || username.length < 2 || username.length > 20) {
        return { success: false, message: "帳號必須在 2-20 個字符之間" };
      }

      if (!password || password.length < 6) {
        return { success: false, message: "密碼至少需要 6 個字符" };
      }

      // 預設顯示名稱為帳號
      const name = displayName?.trim() || username;

      // 檢查用戶名是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return { success: false, message: "帳號已被使用" };
      }

      // 加密密碼
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);

      // 創建用戶
      const user = await prisma.user.create({
        data: {
          username,
          displayName: name,
          password: hashedPassword,
          rating: 1000,
          rank: "bronze",
          wins: 0,
          losses: 0,
          draws: 0,
        },
      });

      // 生成 JWT
      const token = this.generateToken(user.id, user.username);

      // 返回用戶資訊（不含密碼）
      const publicInfo: PublicUserInfo = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        rating: user.rating,
        rank: user.rank as Rank,
        wins: user.wins,
        losses: user.losses,
      };

      console.log(`[AuthService] User registered: ${username}`);

      return {
        success: true,
        message: "註冊成功",
        user: publicInfo,
        token,
      };
    } catch (error) {
      console.error("[AuthService] Register error:", error);
      return { success: false, message: "註冊失敗，請稍後再試" };
    }
  }

  /**
   * 使用者登入
   */
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      // 檢查資料庫連接
      if (!prisma) {
        return { success: false, message: "資料庫服務暫時無法使用" };
      }

      // 驗證輸入
      if (!username || !password) {
        return { success: false, message: "請輸入用戶名和密碼" };
      }

      // 查找用戶
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return { success: false, message: "用戶名或密碼錯誤" };
      }

      // 驗證密碼
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return { success: false, message: "用戶名或密碼錯誤" };
      }

      // 更新最後登入時間
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // 生成 JWT
      const token = this.generateToken(user.id, user.username);

      // 返回用戶資訊
      const publicInfo: PublicUserInfo = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        rating: user.rating,
        rank: user.rank as Rank,
        wins: user.wins,
        losses: user.losses,
      };

      console.log(`[AuthService] User logged in: ${username}`);

      return {
        success: true,
        message: "登入成功",
        user: publicInfo,
        token,
      };
    } catch (error) {
      console.error("[AuthService] Login error:", error);
      return { success: false, message: "登入失敗，請稍後再試" };
    }
  }

  /**
   * 驗證 JWT Token
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      // 檢查資料庫連接
      if (!prisma) {
        return { success: false, message: "資料庫服務暫時無法使用" };
      }

      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      // 查找用戶確認仍存在
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return { success: false, message: "用戶不存在" };
      }

      const publicInfo: PublicUserInfo = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        rating: user.rating,
        rank: user.rank as Rank,
        wins: user.wins,
        losses: user.losses,
      };

      return {
        success: true,
        message: "驗證成功",
        user: publicInfo,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { success: false, message: "Token 已過期，請重新登入" };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { success: false, message: "無效的 Token" };
      }
      console.error("[AuthService] Verify token error:", error);
      return { success: false, message: "驗證失敗" };
    }
  }

  /**
   * 根據 ID 獲取用戶資訊
   */
  async getUserById(userId: string): Promise<PublicUserInfo | null> {
    try {
      if (!prisma) return null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        rating: user.rating,
        rank: user.rank as Rank,
        wins: user.wins,
        losses: user.losses,
      };
    } catch (error) {
      console.error("[AuthService] Get user error:", error);
      return null;
    }
  }

  /**
   * 更新顯示名稱
   */
  async updateDisplayName(userId: string, newDisplayName: string): Promise<AuthResult> {
    try {
      if (!prisma) {
        return { success: false, message: "資料庫服務暫時無法使用" };
      }

      if (!newDisplayName || newDisplayName.trim().length < 1 || newDisplayName.trim().length > 20) {
        return { success: false, message: "名稱必須在 1-20 個字符之間" };
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { displayName: newDisplayName.trim() },
      });

      const publicInfo: PublicUserInfo = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        rating: user.rating,
        rank: user.rank as Rank,
        wins: user.wins,
        losses: user.losses,
      };

      console.log(`[AuthService] Display name updated: ${user.username} -> ${newDisplayName}`);

      return {
        success: true,
        message: "名稱更新成功",
        user: publicInfo,
      };
    } catch (error) {
      console.error("[AuthService] Update display name error:", error);
      return { success: false, message: "更新失敗" };
    }
  }

  /**
   * 更新用戶遊戲統計
   */
  /**
   * 更新用戶遊戲統計（積分、勝負場數）
   */
  async updateUserStats(
    userId: string,
    newRating: number,
    newWins: number,
    newLosses: number
  ): Promise<boolean> {
    try {
      if (!prisma) return false;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return false;

      const newRank = this.calculateRank(newRating);

      await prisma.user.update({
        where: { id: userId },
        data: {
          rating: newRating,
          rank: newRank,
          wins: newWins,
          losses: newLosses,
        },
      });

      console.log(`[AuthService] Stats updated for ${user.username}: rating=${newRating}, wins=${newWins}, losses=${newLosses}`);
      return true;
    } catch (error) {
      console.error("[AuthService] Update stats error:", error);
      return false;
    }
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(userId: string, username: string): string {
    const payload: JwtPayload = { userId, username };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: "7d" });
  }

  /**
   * 計算段位
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
}

export const authService = new AuthService();
