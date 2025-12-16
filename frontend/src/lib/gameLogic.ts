/**
 * 五子棋遊戲核心邏輯
 * 
 * 包含勝負判斷、棋盤操作等核心功能
 */

import { BoardState, Position, StoneColor, GameResult } from "@/types";
import { BOARD_SIZE, WIN_CONDITION } from "@/constants";

/**
 * 建立空白棋盤
 * @returns 15x15 的空白棋盤
 */
export function createEmptyBoard(): BoardState {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}

/**
 * 複製棋盤狀態（深拷貝）
 * @param board - 原始棋盤
 * @returns 複製的棋盤
 */
export function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => [...row]);
}

/**
 * 檢查位置是否在棋盤範圍內
 * @param position - 要檢查的位置
 * @returns 是否在範圍內
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.x >= 0 &&
    position.x < BOARD_SIZE &&
    position.y >= 0 &&
    position.y < BOARD_SIZE
  );
}

/**
 * 檢查位置是否為空
 * @param board - 棋盤狀態
 * @param position - 要檢查的位置
 * @returns 是否為空
 */
export function isEmptyPosition(board: BoardState, position: Position): boolean {
  if (!isValidPosition(position)) return false;
  return board[position.y][position.x] === null;
}

/**
 * 在棋盤上落子
 * @param board - 棋盤狀態
 * @param position - 落子位置
 * @param color - 棋子顏色
 * @returns 新的棋盤狀態
 */
export function placeStone(
  board: BoardState,
  position: Position,
  color: StoneColor
): BoardState {
  if (!isEmptyPosition(board, position)) {
    throw new Error(`Invalid move: position (${position.x}, ${position.y}) is not empty`);
  }
  
  const newBoard = cloneBoard(board);
  newBoard[position.y][position.x] = color;
  return newBoard;
}

/**
 * 移除棋子（用於悔棋）
 * @param board - 棋盤狀態
 * @param position - 要移除的位置
 * @returns 新的棋盤狀態
 */
export function removeStone(board: BoardState, position: Position): BoardState {
  const newBoard = cloneBoard(board);
  newBoard[position.y][position.x] = null;
  return newBoard;
}

/** 八個方向的向量 */
const DIRECTIONS: Position[] = [
  { x: 1, y: 0 },   // 水平
  { x: 0, y: 1 },   // 垂直
  { x: 1, y: 1 },   // 對角線（右下）
  { x: 1, y: -1 },  // 對角線（右上）
];

/**
 * 檢查是否達成五子連線
 * @param board - 棋盤狀態
 * @param lastMove - 最後一步的位置
 * @param color - 檢查的顏色
 * @returns 勝利結果（如果有的話）
 */
export function checkWin(
  board: BoardState,
  lastMove: Position,
  color: StoneColor
): { isWin: boolean; winningLine?: Position[] } {
  for (const dir of DIRECTIONS) {
    const line = getLineFromPosition(board, lastMove, dir, color);
    if (line.length >= WIN_CONDITION) {
      return { isWin: true, winningLine: line };
    }
  }
  return { isWin: false };
}

/**
 * 獲取某方向上連續同色棋子的位置
 * @param board - 棋盤狀態
 * @param start - 起始位置
 * @param direction - 方向向量
 * @param color - 檢查的顏色
 * @returns 連續同色棋子的位置陣列
 */
function getLineFromPosition(
  board: BoardState,
  start: Position,
  direction: Position,
  color: StoneColor
): Position[] {
  const line: Position[] = [start];

  // 正方向
  let pos = { x: start.x + direction.x, y: start.y + direction.y };
  while (isValidPosition(pos) && board[pos.y][pos.x] === color) {
    line.push({ ...pos });
    pos = { x: pos.x + direction.x, y: pos.y + direction.y };
  }

  // 反方向
  pos = { x: start.x - direction.x, y: start.y - direction.y };
  while (isValidPosition(pos) && board[pos.y][pos.x] === color) {
    line.unshift({ ...pos });
    pos = { x: pos.x - direction.x, y: pos.y - direction.y };
  }

  return line;
}

/**
 * 檢查棋盤是否已滿（平局）
 * @param board - 棋盤狀態
 * @returns 是否已滿
 */
export function isBoardFull(board: BoardState): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

/**
 * 計算棋盤上的總步數
 * @param board - 棋盤狀態
 * @returns 步數
 */
export function countMoves(board: BoardState): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

/**
 * 判斷遊戲結果
 * @param board - 棋盤狀態
 * @param lastMove - 最後一步
 * @param lastColor - 最後落子的顏色
 * @returns 遊戲結果（如果遊戲結束）
 */
export function evaluateGameResult(
  board: BoardState,
  lastMove: Position,
  lastColor: StoneColor
): GameResult | null {
  const winResult = checkWin(board, lastMove, lastColor);
  
  if (winResult.isWin) {
    return {
      winner: lastColor,
      winningLine: winResult.winningLine,
      reason: "five_in_a_row",
    };
  }
  
  if (isBoardFull(board)) {
    return {
      winner: "draw",
      reason: "draw",
    };
  }
  
  return null;
}
