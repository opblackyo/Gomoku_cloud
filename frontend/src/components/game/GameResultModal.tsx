/**
 * 遊戲結果彈窗
 */

"use client";

import { cn } from "@/lib/utils";
import { GameResult, StoneColor } from "@/types";

interface GameResultModalProps {
  /** 遊戲結果 */
  result: GameResult | null;
  /** 玩家的棋子顏色 */
  myColor: StoneColor | null;
  /** 是否顯示 */
  isOpen: boolean;
  /** 是否等待對方回應再來一局 */
  pendingRematch?: boolean;
  /** 再來一局回調 */
  onRematch?: () => void;
  /** 返回大廳回調 */
  onBackToLobby?: () => void;
  /** 關閉回調 */
  onClose: () => void;
}

/**
 * 遊戲結果彈窗元件
 */
export function GameResultModal({
  result,
  myColor,
  isOpen,
  pendingRematch = false,
  onRematch,
  onBackToLobby,
  onClose: _onClose,
}: GameResultModalProps) {
  if (!isOpen || !result) return null;

  const isWinner = result.winner === myColor;
  const isDraw = result.winner === "draw";

  const getResultText = () => {
    if (isDraw) return "平局！";
    return isWinner ? "🎉 恭喜獲勝！" : "😢 很遺憾，你輸了";
  };

  const getReasonText = () => {
    switch (result.reason) {
      case "five_in_a_row":
        return "五子連線";
      case "timeout":
        return "超時判負";
      case "surrender":
        return isWinner ? "對方投降" : "你已投降";
      case "disconnect":
        return "對方斷線";
      case "draw":
        return "棋盤已滿";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* 彈窗內容 */}
      <div
        className={cn(
          "relative z-10 bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-700",
          "transform transition-all animate-in zoom-in-95 duration-300"
        )}
      >
        {/* 結果標題 */}
        <h2
          className={cn(
            "text-3xl font-bold text-center mb-4",
            isDraw
              ? "text-gray-400"
              : isWinner
              ? "text-green-400"
              : "text-red-400"
          )}
        >
          {getResultText()}
        </h2>

        {/* 結果原因 */}
        <p className="text-center text-gray-400 mb-6">{getReasonText()}</p>

        {/* 勝利者棋子 */}
        {!isDraw && (
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-16 h-16 rounded-full shadow-lg",
                result.winner === "black" ? "bg-stone-black" : "bg-stone-white border-2 border-gray-300"
              )}
            />
          </div>
        )}

        {/* 按鈕區域 */}
        <div className="space-y-3">
          {/* 再來一局按鈕 */}
          <button
            className={cn(
              "w-full py-3 rounded-lg font-bold text-lg transition-all",
              pendingRematch
                ? "bg-yellow-600 text-white cursor-wait"
                : "bg-green-600 hover:bg-green-500 text-white"
            )}
            onClick={onRematch}
            disabled={pendingRematch}
          >
            {pendingRematch ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                等待對方回應...
              </span>
            ) : (
              "🔄 再來一局"
            )}
          </button>

          {/* 返回大廳按鈕 */}
          <button
            className="w-full py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
            onClick={onBackToLobby}
          >
            🏠 返回大廳
          </button>
        </div>
      </div>
    </div>
  );
}
