/**
 * 遊戲控制面板
 * 
 * 包含悔棋、投降、再來一局等按鈕
 */

"use client";

import { cn } from "@/lib/utils";

interface GameControlsProps {
  /** 是否遊戲進行中 */
  isPlaying: boolean;
  /** 是否遊戲已結束 */
  isGameOver: boolean;
  /** 是否允許悔棋 */
  allowUndo: boolean;
  /** 是否可以悔棋（至少有己方的棋子） */
  canUndo: boolean;
  /** 是否有待處理的悔棋請求 */
  pendingUndoRequest: boolean;
  /** 是否有待處理的再來一局請求 */
  pendingRematchRequest: boolean;
  /** 悔棋回調 */
  onUndo?: () => void;
  /** 投降回調 */
  onSurrender?: () => void;
  /** 再來一局回調 */
  onRematch?: () => void;
  /** 返回大廳回調 */
  onBackToLobby?: () => void;
}

/**
 * 遊戲控制面板元件
 */
export function GameControls({
  isPlaying,
  isGameOver,
  allowUndo,
  canUndo,
  pendingUndoRequest,
  pendingRematchRequest,
  onUndo,
  onSurrender,
  onRematch,
  onBackToLobby,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* 遊戲進行中的控制項 */}
      {isPlaying && !isGameOver && (
        <>
          {allowUndo && (
            <Button
              variant="secondary"
              onClick={onUndo}
              disabled={pendingUndoRequest || !canUndo}
            >
              {pendingUndoRequest ? "等待回應..." : "請求悔棋"}
            </Button>
          )}
          <Button variant="danger" onClick={onSurrender}>
            投降
          </Button>
        </>
      )}

      {/* 遊戲結束後的控制項 */}
      {isGameOver && (
        <>
          <Button
            variant="primary"
            onClick={onRematch}
            disabled={pendingRematchRequest}
          >
            {pendingRematchRequest ? "等待對手..." : "再來一局"}
          </Button>
          <Button variant="secondary" onClick={onBackToLobby}>
            返回大廳
          </Button>
        </>
      )}
    </div>
  );
}

/** 按鈕樣式變體 */
type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * 通用按鈕元件
 */
function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-slate-600 hover:bg-slate-500 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      className={cn(
        "px-6 py-2 rounded-lg font-medium transition-colors",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed"
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
