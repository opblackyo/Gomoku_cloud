/**
 * 等待對手加入房間的模態框
 */

"use client";

import { useEffect, useState } from "react";
import { Room } from "@/types";

interface WaitingRoomModalProps {
  /** 是否顯示 */
  isOpen: boolean;
  /** 房間資訊 */
  room: Room | null;
  /** 取消/離開房間回調 */
  onLeave: () => void;
}

/**
 * 等待房間模態框元件
 */
export function WaitingRoomModal({ isOpen, room, onLeave }: WaitingRoomModalProps) {
  const [waitingTime, setWaitingTime] = useState(0);
  const [dots, setDots] = useState("");

  // 計時器
  useEffect(() => {
    if (!isOpen) {
      setWaitingTime(0);
      return;
    }

    const timer = setInterval(() => {
      setWaitingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // 動態點點點
  useEffect(() => {
    if (!isOpen) return;

    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotTimer);
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 模態框內容 */}
      <div className="relative z-10 bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-700">
        {/* 標題 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-white mb-2">房間已建立</h2>
          <p className="text-gray-400">{room.name}</p>
        </div>

        {/* 房間資訊 */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">房間類型</span>
            <span className="text-white">
              {room.type === "public" ? "🌐 公開" : "🔒 私人"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">每步時限</span>
            <span className="text-white">
              {room.config.turnTimeLimit >= 60
                ? `${room.config.turnTimeLimit / 60} 分鐘`
                : `${room.config.turnTimeLimit} 秒`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">允許悔棋</span>
            <span className="text-white">
              {room.config.allowUndo ? "✅ 是" : "❌ 否"}
            </span>
          </div>
        </div>

        {/* 等待動畫 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg text-white">
            等待對手加入{dots}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            已等待 {formatTime(waitingTime)}
          </p>
        </div>

        {/* 提示 */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-300 text-center">
            💡 您可以將房間名稱分享給朋友，讓他們搜尋加入
          </p>
        </div>

        {/* 離開按鈕 */}
        <button
          onClick={onLeave}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
        >
          離開房間
        </button>
      </div>
    </div>
  );
}
