/**
 * 建立房間表單
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TURN_TIME_OPTIONS } from "@/constants";

interface CreateRoomFormProps {
  /** 是否顯示 */
  isOpen: boolean;
  /** 建立房間回調 */
  onCreate: (data: {
    name: string;
    type: "public" | "private";
    password?: string;
    config: {
      allowSpectators: boolean;
      turnTimeLimit: number;
      allowUndo: boolean;
    };
  }) => void;
  /** 關閉回調 */
  onClose: () => void;
}

/**
 * 建立房間表單元件
 */
export function CreateRoomForm({ isOpen, onCreate, onClose }: CreateRoomFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [password, setPassword] = useState("");
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [turnTimeLimit, setTurnTimeLimit] = useState(60);
  const [allowUndo, setAllowUndo] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      type,
      password: type === "private" ? password : undefined,
      config: {
        allowSpectators,
        turnTimeLimit,
        allowUndo,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-white">建立房間</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 房間名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              房間名稱
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入房間名稱..."
              className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              maxLength={20}
              required
            />
          </div>

          {/* 房間類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              房間類型
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={type === "public"}
                  onChange={() => setType("public")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-white">公開</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="private"
                  checked={type === "private"}
                  onChange={() => setType("private")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-white">私人</span>
              </label>
            </div>
          </div>

          {/* 密碼（私人房間） */}
          {type === "private" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                房間密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="設定房間密碼..."
                className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                required
              />
            </div>
          )}

          {/* 每步時限 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              每步時限
            </label>
            <select
              value={turnTimeLimit}
              onChange={(e) => setTurnTimeLimit(Number(e.target.value))}
              className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {TURN_TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time >= 60 ? `${time / 60} 分鐘` : `${time} 秒`}
                </option>
              ))}
            </select>
          </div>

          {/* 其他選項 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSpectators}
                onChange={(e) => setAllowSpectators(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-white">允許觀戰</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowUndo}
                onChange={(e) => setAllowUndo(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-white">允許悔棋</span>
            </label>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
