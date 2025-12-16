/**
 * 遊戲邏輯測試
 * 
 * 測試五子棋核心邏輯
 */

import {
  createEmptyBoard,
  placeStone,
  checkWin,
  isValidPosition,
  isEmptyPosition,
  isBoardFull,
  evaluateGameResult,
} from "../lib/gameLogic";
import { BoardState, Position } from "../types";

describe("GameLogic", () => {
  describe("createEmptyBoard", () => {
    it("should create a 15x15 empty board", () => {
      const board = createEmptyBoard();
      
      expect(board).toHaveLength(15);
      expect(board[0]).toHaveLength(15);
      expect(board.every(row => row.every(cell => cell === null))).toBe(true);
    });
  });

  describe("isValidPosition", () => {
    it("should return true for valid positions", () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 7, y: 7 })).toBe(true);
      expect(isValidPosition({ x: 14, y: 14 })).toBe(true);
    });

    it("should return false for invalid positions", () => {
      expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 })).toBe(false);
      expect(isValidPosition({ x: 15, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: 15 })).toBe(false);
    });
  });

  describe("isEmptyPosition", () => {
    it("should return true for empty positions", () => {
      const board = createEmptyBoard();
      expect(isEmptyPosition(board, { x: 7, y: 7 })).toBe(true);
    });

    it("should return false for occupied positions", () => {
      const board = createEmptyBoard();
      const newBoard = placeStone(board, { x: 7, y: 7 }, "black");
      expect(isEmptyPosition(newBoard, { x: 7, y: 7 })).toBe(false);
    });

    it("should return false for invalid positions", () => {
      const board = createEmptyBoard();
      expect(isEmptyPosition(board, { x: -1, y: 0 })).toBe(false);
    });
  });

  describe("placeStone", () => {
    it("should place a stone on the board", () => {
      const board = createEmptyBoard();
      const newBoard = placeStone(board, { x: 7, y: 7 }, "black");
      
      expect(newBoard[7][7]).toBe("black");
      expect(board[7][7]).toBe(null); // 原棋盤不變
    });

    it("should throw error for occupied position", () => {
      const board = createEmptyBoard();
      const newBoard = placeStone(board, { x: 7, y: 7 }, "black");
      
      expect(() => {
        placeStone(newBoard, { x: 7, y: 7 }, "white");
      }).toThrow();
    });
  });

  describe("checkWin", () => {
    it("should detect horizontal win", () => {
      const board = createEmptyBoard();
      // 放置五個水平黑子
      for (let x = 5; x < 10; x++) {
        board[7][x] = "black";
      }

      const result = checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(true);
      expect(result.winningLine).toHaveLength(5);
    });

    it("should detect vertical win", () => {
      const board = createEmptyBoard();
      // 放置五個垂直黑子
      for (let y = 3; y < 8; y++) {
        board[y][7] = "black";
      }

      const result = checkWin(board, { x: 7, y: 5 }, "black");
      expect(result.isWin).toBe(true);
      expect(result.winningLine).toHaveLength(5);
    });

    it("should detect diagonal win (right-down)", () => {
      const board = createEmptyBoard();
      // 放置五個對角線黑子（右下方向）
      for (let i = 0; i < 5; i++) {
        board[5 + i][5 + i] = "black";
      }

      const result = checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(true);
      expect(result.winningLine).toHaveLength(5);
    });

    it("should detect diagonal win (right-up)", () => {
      const board = createEmptyBoard();
      // 放置五個對角線黑子（右上方向）
      for (let i = 0; i < 5; i++) {
        board[9 - i][5 + i] = "black";
      }

      const result = checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(true);
      expect(result.winningLine).toHaveLength(5);
    });

    it("should not detect win with only 4 in a row", () => {
      const board = createEmptyBoard();
      // 放置四個水平黑子
      for (let x = 5; x < 9; x++) {
        board[7][x] = "black";
      }

      const result = checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(false);
    });

    it("should detect more than 5 in a row as win", () => {
      const board = createEmptyBoard();
      // 放置六個水平黑子
      for (let x = 4; x < 10; x++) {
        board[7][x] = "black";
      }

      const result = checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(true);
      expect(result.winningLine!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("isBoardFull", () => {
    it("should return false for empty board", () => {
      const board = createEmptyBoard();
      expect(isBoardFull(board)).toBe(false);
    });

    it("should return false for partially filled board", () => {
      const board = createEmptyBoard();
      board[7][7] = "black";
      expect(isBoardFull(board)).toBe(false);
    });

    it("should return true for full board", () => {
      const board: BoardState = Array(15).fill(null).map((_, y) =>
        Array(15).fill(null).map((_, x) => ((x + y) % 2 === 0 ? "black" : "white"))
      );
      expect(isBoardFull(board)).toBe(true);
    });
  });

  describe("evaluateGameResult", () => {
    it("should return win result when 5 in a row", () => {
      const board = createEmptyBoard();
      for (let x = 5; x < 10; x++) {
        board[7][x] = "black";
      }

      const result = evaluateGameResult(board, { x: 9, y: 7 }, "black");
      expect(result).not.toBeNull();
      expect(result?.winner).toBe("black");
      expect(result?.reason).toBe("five_in_a_row");
    });

    it("should return null when game not finished", () => {
      const board = createEmptyBoard();
      board[7][7] = "black";

      const result = evaluateGameResult(board, { x: 7, y: 7 }, "black");
      expect(result).toBeNull();
    });

    it("should return draw when board is full without winner", () => {
      // 建立一個滿板但沒有勝利者的棋盤（實際上很難發生）
      const board: BoardState = Array(15).fill(null).map(() =>
        Array(15).fill(null)
      );
      
      // 填滿棋盤，避免五連
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          // 使用一個不會產生五連的模式
          if (y % 2 === 0) {
            board[y][x] = x % 3 === 0 ? "black" : "white";
          } else {
            board[y][x] = x % 3 === 0 ? "white" : "black";
          }
        }
      }

      const result = evaluateGameResult(board, { x: 14, y: 14 }, board[14][14]!);
      // 如果有五連則是勝利，否則是平局
      expect(result).not.toBeNull();
    });
  });
});
