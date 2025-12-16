/**
 * GameService 測試
 * 
 * 測試後端遊戲邏輯服務
 */

import { GameService } from "../services/GameService";
import { BoardState, StoneColor } from "../types";

describe("GameService", () => {
  describe("createEmptyBoard", () => {
    it("should create a 15x15 empty board", () => {
      const board = GameService.createEmptyBoard();
      
      expect(board).toHaveLength(15);
      expect(board[0]).toHaveLength(15);
      expect(board.every(row => row.every(cell => cell === null))).toBe(true);
    });
  });

  describe("createGame", () => {
    it("should create a new game with correct initial state", () => {
      const game = GameService.createGame("room-1");
      
      expect(game.id).toBeDefined();
      expect(game.roomId).toBe("room-1");
      expect(game.currentTurn).toBe("black");
      expect(game.status).toBe("playing");
      expect(game.moves).toHaveLength(0);
      expect(game.board).toHaveLength(15);
    });

    it("should use custom turn time limit", () => {
      const game = GameService.createGame("room-1", 120);
      expect(game.turnTimeLimit).toBe(120);
    });
  });

  describe("isValidPosition", () => {
    it("should return true for valid positions", () => {
      expect(GameService.isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(GameService.isValidPosition({ x: 7, y: 7 })).toBe(true);
      expect(GameService.isValidPosition({ x: 14, y: 14 })).toBe(true);
    });

    it("should return false for invalid positions", () => {
      expect(GameService.isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(GameService.isValidPosition({ x: 0, y: 15 })).toBe(false);
    });
  });

  describe("makeMove", () => {
    it("should make a valid move", () => {
      const game = GameService.createGame("room-1");
      const { game: updatedGame, result } = GameService.makeMove(
        game,
        { x: 7, y: 7 },
        "black"
      );

      expect(updatedGame.board[7][7]).toBe("black");
      expect(updatedGame.moves).toHaveLength(1);
      expect(updatedGame.currentTurn).toBe("white");
      expect(result).toBeNull();
    });

    it("should throw error for wrong turn", () => {
      const game = GameService.createGame("room-1");
      
      expect(() => {
        GameService.makeMove(game, { x: 7, y: 7 }, "white");
      }).toThrow("Not your turn");
    });

    it("should throw error for occupied position", () => {
      const game = GameService.createGame("room-1");
      const { game: updatedGame } = GameService.makeMove(
        game,
        { x: 7, y: 7 },
        "black"
      );

      expect(() => {
        GameService.makeMove(updatedGame, { x: 7, y: 7 }, "white");
      }).toThrow();
    });

    it("should detect win", () => {
      let game = GameService.createGame("room-1");
      
      // 模擬黑白交替下棋，讓黑棋連成五子
      const moves = [
        { pos: { x: 7, y: 7 }, color: "black" as StoneColor },
        { pos: { x: 0, y: 0 }, color: "white" as StoneColor },
        { pos: { x: 8, y: 7 }, color: "black" as StoneColor },
        { pos: { x: 0, y: 1 }, color: "white" as StoneColor },
        { pos: { x: 9, y: 7 }, color: "black" as StoneColor },
        { pos: { x: 0, y: 2 }, color: "white" as StoneColor },
        { pos: { x: 10, y: 7 }, color: "black" as StoneColor },
        { pos: { x: 0, y: 3 }, color: "white" as StoneColor },
        { pos: { x: 11, y: 7 }, color: "black" as StoneColor }, // 黑棋勝利
      ];

      for (const move of moves) {
        const { game: updated, result } = GameService.makeMove(
          game,
          move.pos,
          move.color
        );
        game = updated;
        
        if (result) {
          expect(result.winner).toBe("black");
          expect(result.reason).toBe("five_in_a_row");
          expect(game.status).toBe("finished");
          return;
        }
      }

      fail("Should have detected a win");
    });
  });

  describe("checkWin", () => {
    it("should detect horizontal win", () => {
      const board = GameService.createEmptyBoard();
      for (let x = 5; x < 10; x++) {
        board[7][x] = "black";
      }

      const result = GameService.checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(true);
    });

    it("should detect vertical win", () => {
      const board = GameService.createEmptyBoard();
      for (let y = 3; y < 8; y++) {
        board[y][7] = "white";
      }

      const result = GameService.checkWin(board, { x: 7, y: 5 }, "white");
      expect(result.isWin).toBe(true);
    });

    it("should detect diagonal win", () => {
      const board = GameService.createEmptyBoard();
      for (let i = 0; i < 5; i++) {
        board[5 + i][5 + i] = "black";
      }

      const result = GameService.checkWin(board, { x: 7, y: 7 }, "black");
      expect(result.isWin).toBe(true);
    });
  });

  describe("undoMoves", () => {
    it("should undo moves correctly", () => {
      let game = GameService.createGame("room-1");
      
      // 下兩步棋
      const move1 = GameService.makeMove(game, { x: 7, y: 7 }, "black");
      game = move1.game;
      const move2 = GameService.makeMove(game, { x: 8, y: 8 }, "white");
      game = move2.game;

      expect(game.moves).toHaveLength(2);

      // 悔棋兩步
      const undoneGame = GameService.undoMoves(game, 2);
      
      expect(undoneGame.moves).toHaveLength(0);
      expect(undoneGame.board[7][7]).toBeNull();
      expect(undoneGame.board[8][8]).toBeNull();
      expect(undoneGame.currentTurn).toBe("black");
    });

    it("should throw error when undoing more moves than exist", () => {
      const game = GameService.createGame("room-1");
      
      expect(() => {
        GameService.undoMoves(game, 1);
      }).toThrow();
    });
  });

  describe("handleTimeout", () => {
    it("should declare opponent as winner", () => {
      const game = GameService.createGame("room-1");
      const { result } = GameService.handleTimeout(game);

      expect(result.winner).toBe("white"); // 黑棋超時，白棋勝
      expect(result.reason).toBe("timeout");
    });
  });

  describe("handleSurrender", () => {
    it("should declare opponent as winner", () => {
      const game = GameService.createGame("room-1");
      const { result } = GameService.handleSurrender(game, "black");

      expect(result.winner).toBe("white");
      expect(result.reason).toBe("surrender");
    });
  });

  describe("handleDisconnect", () => {
    it("should declare opponent as winner", () => {
      const game = GameService.createGame("room-1");
      const { result } = GameService.handleDisconnect(game, "white");

      expect(result.winner).toBe("black");
      expect(result.reason).toBe("disconnect");
    });
  });
});
