/**
 * 登入/註冊模態框
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  /** 是否顯示 */
  isOpen: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 登入回調 */
  onLogin: (username: string, password: string) => void;
  /** 註冊回調 */
  onRegister: (username: string, password: string, displayName: string) => void;
  /** 是否載入中 */
  isLoading?: boolean;
  /** 錯誤訊息 */
  error?: string | null;
}

type AuthMode = "login" | "register";

/**
 * 登入/註冊模態框元件
 */
export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  isLoading = false,
  error = null,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // 重置表單
  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setDisplayName("");
      setPassword("");
      setConfirmPassword("");
      setLocalError(null);
    }
  }, [isOpen]);

  // 清除錯誤
  useEffect(() => {
    setLocalError(null);
  }, [mode, username, displayName, password, confirmPassword]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證
    if (!username.trim()) {
      setLocalError("請輸入帳號");
      return;
    }

    if (username.length < 2 || username.length > 20) {
      setLocalError("帳號必須在 2-20 個字符之間");
      return;
    }

    if (!password) {
      setLocalError("請輸入密碼");
      return;
    }

    if (password.length < 6) {
      setLocalError("密碼至少需要 6 個字符");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setLocalError("兩次輸入的密碼不一致");
        return;
      }
      const name = displayName.trim() || username.trim();
      onRegister(username.trim(), password, name);
    } else {
      onLogin(username.trim(), password);
    }
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模態框內容 */}
      <div className="relative z-10 bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-700">
        {/* 標題切換 */}
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 py-3 text-lg font-bold rounded-l-xl transition-colors",
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-gray-400 hover:bg-slate-600"
            )}
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "flex-1 py-3 text-lg font-bold rounded-r-xl transition-colors",
              mode === "register"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-gray-400 hover:bg-slate-600"
            )}
          >
            註冊
          </button>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 帳號 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              帳號 {mode === "register" && <span className="text-gray-500 text-xs">（登入用，不可修改）</span>}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="輸入帳號..."
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              maxLength={20}
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          {/* 顯示名稱（僅註冊） */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                顯示名稱 <span className="text-gray-500 text-xs">（可修改，留空則使用帳號）</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="輸入顯示名稱..."
                className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                maxLength={20}
                disabled={isLoading}
              />
            </div>
          )}

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼..."
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={isLoading}
            />
          </div>

          {/* 確認密碼（僅註冊） */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                確認密碼
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入密碼..."
                className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          )}

          {/* 錯誤訊息 */}
          {displayError && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-300 text-center">{displayError}</p>
            </div>
          )}

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-white transition-colors",
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                處理中...
              </span>
            ) : mode === "login" ? (
              "登入"
            ) : (
              "註冊"
            )}
          </button>
        </form>

        {/* 底部提示 */}
        <div className="mt-4 text-center text-sm text-gray-400">
          {mode === "login" ? (
            <p>
              還沒有帳號？{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                立即註冊
              </button>
            </p>
          ) : (
            <p>
              已有帳號？{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                立即登入
              </button>
            </p>
          )}
        </div>

        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
