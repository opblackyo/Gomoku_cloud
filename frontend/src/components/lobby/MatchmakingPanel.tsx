/**
 * 匹配面板元件
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MatchmakingStatus } from "@/types";

interface MatchmakingPanelProps {
  /** 匹配狀態 */
  status: MatchmakingStatus;
  /** 開始匹配回調 */
  onStartMatchmaking: () => void;
  /** 取消匹配回調 */
  onCancelMatchmaking: () => void;
  /** 建立房間回調 */
  onCreateRoom: () => void;
}

/**
 * 匹配面板元件
 */
export function MatchmakingPanel({
  status,
  onStartMatchmaking,
  onCancelMatchmaking,
  onCreateRoom,
}: MatchmakingPanelProps) {
  const [elapsed, setElapsed] = useState(0);

  // 計算匹配時間
  useEffect(() => {
    if (!status.isSearching || !status.searchStartedAt) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - status.searchStartedAt!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status.isSearching, status.searchStartedAt]);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold mb-6 text-center text-white">開始對戰</h2>

      {status.isSearching ? (
        // 匹配中狀態
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg font-medium mb-2 text-white">正在尋找對手...</p>
          <p className="text-gray-400 mb-4">
            已等待: {formatElapsedTime(elapsed)}
          </p>
          {status.estimatedWaitTime && (
            <p className="text-sm text-gray-500">
              預估等待時間: ~{status.estimatedWaitTime}秒
            </p>
          )}
          <button
            onClick={onCancelMatchmaking}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            取消匹配
          </button>
        </div>
      ) : (
        // 未匹配狀態
        <div className="space-y-4">
          <button
            onClick={onStartMatchmaking}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all",
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              "text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            )}
          >
            🎮 隨機匹配
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-800 px-4 text-gray-400 text-sm">或</span>
            </div>
          </div>

          <button
            onClick={onCreateRoom}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all",
              "bg-slate-700 hover:bg-slate-600 text-white",
              "border-2 border-dashed border-slate-500 hover:border-slate-400"
            )}
          >
            ➕ 建立房間
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 格式化已等待時間
 */
function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}
