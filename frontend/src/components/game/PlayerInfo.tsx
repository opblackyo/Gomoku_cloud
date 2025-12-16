/**
 * 玩家資訊卡片
 * 
 * 顯示玩家頭像、名稱、段位和當前狀態
 */

"use client";

import { cn } from "@/lib/utils";
import { PublicUserInfo, StoneColor } from "@/types";
import { getRankConfig } from "@/constants";

interface PlayerInfoProps {
  /** 玩家資訊 */
  player: PublicUserInfo | null;
  /** 玩家棋子顏色 */
  color: StoneColor;
  /** 是否為當前回合 */
  isCurrentTurn: boolean;
  /** 剩餘時間（秒） */
  timeRemaining?: number;
  /** 是否為自己 */
  isMe?: boolean;
}

/**
 * 玩家資訊卡片元件
 */
export function PlayerInfo({
  player,
  color,
  isCurrentTurn,
  timeRemaining,
  isMe = false,
}: PlayerInfoProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
        <div className="w-12 h-12 bg-slate-600 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-5 w-24 bg-slate-600 rounded animate-pulse" />
          <div className="h-4 w-16 bg-slate-700 rounded mt-2 animate-pulse" />
        </div>
      </div>
    );
  }

  const rankConfig = getRankConfig(player.rank);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg transition-all",
        isCurrentTurn
          ? "bg-yellow-900/40 border-2 border-yellow-500 shadow-md"
          : "bg-slate-700/50 border-2 border-transparent"
      )}
    >
      {/* 棋子顏色指示器 */}
      <div className="relative">
        <div
          className={cn(
            "w-12 h-12 rounded-full shadow-md flex items-center justify-center text-xl font-bold",
            color === "black"
              ? "bg-stone-black text-white"
              : "bg-stone-white border-2 border-gray-300 text-black"
          )}
        >
          {player.username.charAt(0).toUpperCase()}
        </div>
        {isMe && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">我</span>
          </div>
        )}
      </div>

      {/* 玩家資訊 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg truncate text-white">{player.username}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: rankConfig.color, color: getContrastColor(rankConfig.color) }}
          >
            {rankConfig.displayName.split(" ")[0]}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          <span>Rating: {player.rating}</span>
          <span className="mx-2">•</span>
          <span>
            {player.wins}W / {player.losses}L
          </span>
        </div>
      </div>

      {/* 計時器 */}
      {timeRemaining !== undefined && isCurrentTurn && (
        <div
          className={cn(
            "text-2xl font-mono font-bold tabular-nums",
            timeRemaining <= 10 ? "text-red-500 animate-pulse" : "text-white"
          )}
        >
          {formatTime(timeRemaining)}
        </div>
      )}
    </div>
  );
}

/**
 * 格式化時間顯示
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 根據背景色計算對比文字顏色
 */
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
