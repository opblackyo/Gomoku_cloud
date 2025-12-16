/**
 * 遊戲狀態管理
 * 
 * 使用 Zustand 管理五子棋遊戲的核心狀態
 */

import { create } from "zustand";
import { BoardState, Move, StoneColor, GameResult, Position, PublicUserInfo } from "@/types";
import { createEmptyBoard, placeStone, removeStone } from "@/lib/gameLogic";

interface GameState {
  /** 遊戲 ID */
  gameId: string | null;
  /** 棋盤狀態 */
  board: BoardState;
  /** 當前回合 */
  currentTurn: StoneColor;
  /** 玩家的棋子顏色 */
  myColor: StoneColor | null;
  /** 對手資訊 */
  opponent: PublicUserInfo | null;
  /** 自己的資訊 */
  myInfo: PublicUserInfo | null;
  /** 落子記錄 */
  moves: Move[];
  /** 遊戲是否進行中 */
  isPlaying: boolean;
  /** 遊戲結果 */
  result: GameResult | null;
  /** 回合剩餘時間（秒） */
  turnTimeRemaining: number;
  /** 是否有待處理的悔棋請求 */
  pendingUndoRequest: boolean;
  /** 是否有待處理的再來一局請求 */
  pendingRematchRequest: boolean;
  /** 房間 ID */
  roomId: string | null;
}

interface GameActions {
  /** 初始化新遊戲 */
  initGame: (gameId: string, myColor: StoneColor, firstMove: StoneColor, opponent?: PublicUserInfo, myInfo?: PublicUserInfo, roomId?: string) => void;
  /** 落子 */
  makeMove: (position: Position, color: StoneColor) => void;
  /** 悔棋（移除最後一步或多步） */
  undoMoves: (count: number) => void;
  /** 設置遊戲結果 */
  setResult: (result: GameResult) => void;
  /** 更新回合時間 */
  updateTurnTime: (time: number) => void;
  /** 切換回合 */
  switchTurn: () => void;
  /** 設置悔棋請求狀態 */
  setPendingUndoRequest: (pending: boolean) => void;
  /** 設置再來一局請求狀態 */
  setPendingRematchRequest: (pending: boolean) => void;
  /** 更新我的資訊 */
  updateMyInfo: (info: Partial<PublicUserInfo>) => void;
  /** 重置遊戲狀態 */
  resetGame: () => void;
}

const initialState: GameState = {
  gameId: null,
  board: createEmptyBoard(),
  currentTurn: "black",
  myColor: null,
  opponent: null,
  myInfo: null,
  moves: [],
  isPlaying: false,
  result: null,
  turnTimeRemaining: 60,
  pendingUndoRequest: false,
  pendingRematchRequest: false,
  roomId: null,
};

/**
 * 遊戲狀態 Store
 */
export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  initGame: (gameId, myColor, firstMove, opponent, myInfo, roomId) => {
    set({
      gameId,
      board: createEmptyBoard(),
      currentTurn: firstMove,
      myColor,
      opponent: opponent || null,
      myInfo: myInfo || null,
      moves: [],
      isPlaying: true,
      result: null,
      turnTimeRemaining: 60,
      pendingUndoRequest: false,
      pendingRematchRequest: false,
      roomId: roomId || null,
    });
  },

  makeMove: (position, color) => {
    const { board, moves } = get();
    const newBoard = placeStone(board, position, color);
    const newMove: Move = {
      position,
      color,
      timestamp: Date.now(),
      moveNumber: moves.length + 1,
    };

    set({
      board: newBoard,
      moves: [...moves, newMove],
    });
  },

  undoMoves: (count) => {
    const { board, moves } = get();
    if (count > moves.length) {
      console.warn("Cannot undo more moves than exist");
      return;
    }

    let newBoard = board;
    const removedMoves = moves.slice(-count);
    
    // 從棋盤移除棋子
    for (const move of removedMoves) {
      newBoard = removeStone(newBoard, move.position);
    }

    // 計算悔棋後的回合
    const remainingMoves = moves.slice(0, -count);
    const lastMove = remainingMoves[remainingMoves.length - 1];
    const newCurrentTurn = lastMove 
      ? (lastMove.color === "black" ? "white" : "black")
      : "black";

    set({
      board: newBoard,
      moves: remainingMoves,
      currentTurn: newCurrentTurn,
    });
  },

  setResult: (result) => {
    set({
      result,
      isPlaying: false,
    });
  },

  updateTurnTime: (time) => {
    set({ turnTimeRemaining: time });
  },

  switchTurn: () => {
    const { currentTurn } = get();
    set({
      currentTurn: currentTurn === "black" ? "white" : "black",
    });
  },

  setPendingUndoRequest: (pending) => {
    set({ pendingUndoRequest: pending });
  },

  setPendingRematchRequest: (pending) => {
    set({ pendingRematchRequest: pending });
  },

  updateMyInfo: (info) => {
    const { myInfo } = get();
    if (myInfo) {
      set({
        myInfo: { ...myInfo, ...info },
      });
    }
  },

  resetGame: () => {
    set(initialState);
  },
}));
