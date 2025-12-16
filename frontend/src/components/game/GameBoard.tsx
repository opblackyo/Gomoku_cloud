/**
 * 五子棋盤元件
 * 
 * 可互動的 15x15 棋盤，支援落子和勝利連線顯示
 * 手機友善：點擊選擇位置，再確認落子
 */

"use client";

import { useMemo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { BoardState, Position, StoneColor } from "@/types";
import { BOARD_SIZE } from "@/constants";

interface GameBoardProps {
  /** 棋盤狀態 */
  board: BoardState;
  /** 是否可以落子 */
  canPlay: boolean;
  /** 當前回合 */
  currentTurn: StoneColor;
  /** 玩家的顏色 */
  myColor: StoneColor | null;
  /** 勝利連線位置 */
  winningLine?: Position[];
  /** 最後一步位置 */
  lastMove?: Position;
  /** 落子回調 */
  onMove?: (position: Position) => void;
}

/**
 * 五子棋盤主元件
 */
export function GameBoard({
  board,
  canPlay,
  currentTurn,
  myColor,
  winningLine,
  lastMove,
  onMove,
}: GameBoardProps) {
  /** 選中的位置（待確認落子） */
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  /** 是否輪到玩家 */
  const isMyTurn = myColor === currentTurn;

  /** 檢查位置是否在勝利連線上 */
  const isWinningPosition = useCallback(
    (x: number, y: number): boolean => {
      if (!winningLine) return false;
      return winningLine.some((pos) => pos.x === x && pos.y === y);
    },
    [winningLine]
  );

  /** 檢查是否為最後一步 */
  const isLastMove = useCallback(
    (x: number, y: number): boolean => {
      if (!lastMove) return false;
      return lastMove.x === x && lastMove.y === y;
    },
    [lastMove]
  );

  /** 檢查是否為選中位置 */
  const isSelected = useCallback(
    (x: number, y: number): boolean => {
      if (!selectedPosition) return false;
      return selectedPosition.x === x && selectedPosition.y === y;
    },
    [selectedPosition]
  );

  /** 處理格子點擊 - 選擇位置 */
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!canPlay || !isMyTurn || board[y][x] !== null) return;
      
      // 如果點擊同一個位置，取消選擇
      if (selectedPosition?.x === x && selectedPosition?.y === y) {
        setSelectedPosition(null);
      } else {
        setSelectedPosition({ x, y });
      }
    },
    [canPlay, isMyTurn, board, selectedPosition]
  );

  /** 確認落子 */
  const handleConfirmMove = useCallback(() => {
    if (!selectedPosition || !canPlay || !isMyTurn) return;
    onMove?.(selectedPosition);
    setSelectedPosition(null);
  }, [selectedPosition, canPlay, isMyTurn, onMove]);

  /** 取消選擇 */
  const handleCancelSelection = useCallback(() => {
    setSelectedPosition(null);
  }, []);

  /** 渲染棋盤格子 */
  const cells = useMemo(() => {
    const result: JSX.Element[] = [];

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const stone = board[y][x];
        const isWinning = isWinningPosition(x, y);
        const isLast = isLastMove(x, y);
        const selected = isSelected(x, y);
        const canClick = canPlay && isMyTurn && stone === null;

        result.push(
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            stone={stone}
            isWinning={isWinning}
            isLastMove={isLast}
            isSelected={selected}
            previewColor={selected ? myColor : null}
            canClick={canClick}
            onClick={() => handleCellClick(x, y)}
          />
        );
      }
    }

    return result;
  }, [board, isWinningPosition, isLastMove, isSelected, canPlay, isMyTurn, myColor, handleCellClick]);

  return (
    <div className="relative">
      {/* 棋盤背景 */}
      <div
        className="grid bg-board-light rounded-lg shadow-xl p-4"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gap: 0,
        }}
      >
        {cells}
      </div>

      {/* 落子確認按鈕 */}
      {selectedPosition && isMyTurn && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={handleCancelSelection}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
          >
            ✕ 取消
          </button>
          <button
            onClick={handleConfirmMove}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg animate-pulse"
          >
            ✓ 確認落子
          </button>
        </div>
      )}

      {/* 回合提示 */}
      <div className="mt-4 text-center">
        {canPlay ? (
          <p className="text-lg font-medium">
            {isMyTurn ? (
              selectedPosition ? (
                <span className="text-yellow-400">
                  已選擇位置 ({selectedPosition.x + 1}, {selectedPosition.y + 1})，請確認落子
                </span>
              ) : (
                <span className="text-green-400">輪到你了！點擊棋盤選擇位置</span>
              )
            ) : (
              <span className="text-gray-400">等待對手落子...</span>
            )}
          </p>
        ) : (
          <p className="text-gray-500">遊戲尚未開始</p>
        )}
      </div>
    </div>
  );
}

/** 單一格子 Props */
interface CellProps {
  x: number;
  y: number;
  stone: StoneColor | null;
  isWinning: boolean;
  isLastMove: boolean;
  isSelected: boolean;
  previewColor: StoneColor | null;
  canClick: boolean;
  onClick: () => void;
}

/**
 * 單一棋盤格子
 */
function Cell({
  x,
  y,
  stone,
  isWinning,
  isLastMove,
  isSelected,
  previewColor,
  canClick,
  onClick,
}: CellProps) {
  // 計算邊界線樣式
  const isTop = y === 0;
  const isBottom = y === BOARD_SIZE - 1;
  const isLeft = x === 0;
  const isRight = x === BOARD_SIZE - 1;

  return (
    <div
      className={cn(
        "relative w-8 h-8 sm:w-10 sm:h-10",
        canClick && "cursor-pointer hover:bg-yellow-200/30",
        isSelected && "bg-yellow-300/50"
      )}
      onClick={onClick}
    >
      {/* 網格線 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 橫線 */}
        <div
          className={cn(
            "absolute h-px bg-board-line",
            isLeft ? "left-1/2 right-0" : isRight ? "left-0 right-1/2" : "left-0 right-0"
          )}
        />
        {/* 縱線 */}
        <div
          className={cn(
            "absolute w-px bg-board-line",
            isTop ? "top-1/2 bottom-0" : isBottom ? "top-0 bottom-1/2" : "top-0 bottom-0"
          )}
        />
      </div>

      {/* 星位點 (天元和星) */}
      {isStarPoint(x, y) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-board-line rounded-full" />
        </div>
      )}

      {/* 選中預覽（半透明棋子） */}
      {isSelected && previewColor && !stone && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className={cn(
              "w-7 h-7 sm:w-9 sm:h-9 rounded-full shadow-lg transition-all opacity-60 animate-pulse",
              previewColor === "black" ? "bg-stone-black" : "bg-stone-white border border-gray-300",
              "ring-2 ring-yellow-400"
            )}
          />
        </div>
      )}

      {/* 棋子 */}
      {stone && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className={cn(
              "w-7 h-7 sm:w-9 sm:h-9 rounded-full shadow-lg transition-all",
              stone === "black" ? "bg-stone-black" : "bg-stone-white border border-gray-300",
              isWinning && "ring-2 ring-yellow-400 ring-offset-2",
              isLastMove && "ring-2 ring-red-500"
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 判斷是否為星位點
 * 五子棋標準星位：天元(7,7) 和四個角星(3,3)(3,11)(11,3)(11,11)
 */
function isStarPoint(x: number, y: number): boolean {
  const starPoints = [
    { x: 7, y: 7 },   // 天元
    { x: 3, y: 3 },
    { x: 3, y: 11 },
    { x: 11, y: 3 },
    { x: 11, y: 11 },
  ];
  return starPoints.some((p) => p.x === x && p.y === y);
}
