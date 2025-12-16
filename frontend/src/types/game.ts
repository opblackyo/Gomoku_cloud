/**
 * 核心型別定義 - 五子棋對戰平台
 * 
 * 遵循 DDD 原則，定義領域核心型別
 */

/** 棋子顏色 */
export type StoneColor = "black" | "white";

/** 棋盤座標 */
export interface Position {
  x: number;
  y: number;
}

/** 單一落子記錄 */
export interface Move {
  position: Position;
  color: StoneColor;
  timestamp: number;
  /** 落子序號，用於悔棋功能 */
  moveNumber: number;
}

/** 棋盤狀態 - 15x15 的二維陣列 */
export type BoardState = (StoneColor | null)[][];

/** 遊戲狀態 */
export type GameStatus = 
  | "waiting"     // 等待對手
  | "playing"     // 遊戲進行中
  | "paused"      // 暫停（如悔棋請求中）
  | "finished";   // 遊戲結束

/** 遊戲結果 */
export interface GameResult {
  winner: StoneColor | "draw";
  winningLine?: Position[];
  reason: "five_in_a_row" | "timeout" | "surrender" | "disconnect" | "draw";
}

/** 遊戲實例 */
export interface Game {
  id: string;
  roomId: string;
  board: BoardState;
  currentTurn: StoneColor;
  moves: Move[];
  status: GameStatus;
  result?: GameResult;
  /** 每步時限（秒） */
  turnTimeLimit: number;
  /** 當前回合剩餘時間（秒） */
  turnTimeRemaining: number;
  createdAt: number;
  updatedAt: number;
}
