/**
 * 五子棋遊戲核心型別定義
 * 
 * 與前端共享的型別定義
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
  moveNumber: number;
}

/** 棋盤狀態 - 15x15 的二維陣列 */
export type BoardState = (StoneColor | null)[][];

/** 遊戲狀態 */
export type GameStatus = 
  | "waiting"
  | "playing"
  | "paused"
  | "finished";

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
  turnTimeLimit: number;
  turnTimeRemaining: number;
  createdAt: number;
  updatedAt: number;
}
