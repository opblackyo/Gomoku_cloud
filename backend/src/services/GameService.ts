/**
 * 五子棋遊戲核心邏輯服務
 * 
 * 提供棋盤操作、勝負判斷等核心功能
 */

import { v4 as uuidv4 } from "uuid";
import { 
  BoardState, 
  Position, 
  StoneColor, 
  Game, 
  Move, 
  GameResult 
} from "../types";
import { BOARD_SIZE, WIN_CONDITION, DEFAULT_TURN_TIME_LIMIT } from "../constants";

/**
 * 遊戲邏輯服務類
 * 
 * 遵循單一職責原則，專注於遊戲規則和邏輯
 */
export class GameService {
  /**
   * 建立空白棋盤
   */
  static createEmptyBoard(): BoardState {
    return Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
  }

  /**
   * 建立新遊戲
   */
  static createGame(roomId: string, turnTimeLimit?: number): Game {
    return {
      id: uuidv4(),
      roomId,
      board: this.createEmptyBoard(),
      currentTurn: "black", // 黑棋先行
      moves: [],
      status: "playing",
      turnTimeLimit: turnTimeLimit || DEFAULT_TURN_TIME_LIMIT,
      turnTimeRemaining: turnTimeLimit || DEFAULT_TURN_TIME_LIMIT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * 檢查位置是否有效
   */
  static isValidPosition(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < BOARD_SIZE &&
      position.y >= 0 &&
      position.y < BOARD_SIZE
    );
  }

  /**
   * 檢查位置是否為空
   */
  static isEmptyPosition(board: BoardState, position: Position): boolean {
    if (!this.isValidPosition(position)) return false;
    return board[position.y][position.x] === null;
  }

  /**
   * 執行落子
   * @returns 更新後的遊戲狀態和可能的遊戲結果
   */
  static makeMove(
    game: Game,
    position: Position,
    color: StoneColor
  ): { game: Game; result: GameResult | null } {
    // 驗證是否為當前回合
    if (game.currentTurn !== color) {
      throw new Error(`Not your turn. Current turn: ${game.currentTurn}`);
    }

    // 驗證位置有效性
    if (!this.isEmptyPosition(game.board, position)) {
      throw new Error(`Invalid position: (${position.x}, ${position.y})`);
    }

    // 落子
    const newBoard = game.board.map((row) => [...row]);
    newBoard[position.y][position.x] = color;

    // 記錄落子
    const newMove: Move = {
      position,
      color,
      timestamp: Date.now(),
      moveNumber: game.moves.length + 1,
    };

    // 檢查勝負
    const winResult = this.checkWin(newBoard, position, color);
    const isDraw = this.isBoardFull(newBoard);

    let result: GameResult | null = null;
    let status = game.status;

    if (winResult.isWin) {
      result = {
        winner: color,
        winningLine: winResult.winningLine,
        reason: "five_in_a_row",
      };
      status = "finished";
    } else if (isDraw) {
      result = {
        winner: "draw",
        reason: "draw",
      };
      status = "finished";
    }

    const updatedGame: Game = {
      ...game,
      board: newBoard,
      moves: [...game.moves, newMove],
      currentTurn: color === "black" ? "white" : "black",
      status,
      result: result || undefined,
      turnTimeRemaining: game.turnTimeLimit,
      updatedAt: Date.now(),
    };

    return { game: updatedGame, result };
  }

  /**
   * 檢查五子連線
   */
  static checkWin(
    board: BoardState,
    lastMove: Position,
    color: StoneColor
  ): { isWin: boolean; winningLine?: Position[] } {
    const directions: Position[] = [
      { x: 1, y: 0 },   // 水平
      { x: 0, y: 1 },   // 垂直
      { x: 1, y: 1 },   // 對角線（右下）
      { x: 1, y: -1 },  // 對角線（右上）
    ];

    for (const dir of directions) {
      const line = this.getLineFromPosition(board, lastMove, dir, color);
      if (line.length >= WIN_CONDITION) {
        return { isWin: true, winningLine: line };
      }
    }

    return { isWin: false };
  }

  /**
   * 獲取某方向上連續同色棋子
   */
  private static getLineFromPosition(
    board: BoardState,
    start: Position,
    direction: Position,
    color: StoneColor
  ): Position[] {
    const line: Position[] = [start];

    // 正方向
    let pos = { x: start.x + direction.x, y: start.y + direction.y };
    while (this.isValidPosition(pos) && board[pos.y][pos.x] === color) {
      line.push({ ...pos });
      pos = { x: pos.x + direction.x, y: pos.y + direction.y };
    }

    // 反方向
    pos = { x: start.x - direction.x, y: start.y - direction.y };
    while (this.isValidPosition(pos) && board[pos.y][pos.x] === color) {
      line.unshift({ ...pos });
      pos = { x: pos.x - direction.x, y: pos.y - direction.y };
    }

    return line;
  }

  /**
   * 檢查棋盤是否已滿
   */
  static isBoardFull(board: BoardState): boolean {
    return board.every((row) => row.every((cell) => cell !== null));
  }

  /**
   * 執行悔棋
   * @param count 悔棋步數（通常為2，雙方各一步）
   */
  static undoMoves(game: Game, count: number): Game {
    if (count > game.moves.length) {
      throw new Error("Cannot undo more moves than exist");
    }

    const removedMoves = game.moves.slice(-count);
    const remainingMoves = game.moves.slice(0, -count);

    // 重建棋盤
    const newBoard = this.createEmptyBoard();
    for (const move of remainingMoves) {
      newBoard[move.position.y][move.position.x] = move.color;
    }

    // 確定當前回合
    const lastMove = remainingMoves[remainingMoves.length - 1];
    const currentTurn: StoneColor = lastMove 
      ? (lastMove.color === "black" ? "white" : "black")
      : "black";

    return {
      ...game,
      board: newBoard,
      moves: remainingMoves,
      currentTurn,
      turnTimeRemaining: game.turnTimeLimit,
      updatedAt: Date.now(),
    };
  }

  /**
   * 處理超時
   */
  static handleTimeout(game: Game): { game: Game; result: GameResult } {
    const winner: StoneColor = game.currentTurn === "black" ? "white" : "black";
    const result: GameResult = {
      winner,
      reason: "timeout",
    };

    return {
      game: {
        ...game,
        status: "finished",
        result,
        updatedAt: Date.now(),
      },
      result,
    };
  }

  /**
   * 處理投降
   */
  static handleSurrender(game: Game, surrenderColor: StoneColor): { game: Game; result: GameResult } {
    const winner: StoneColor = surrenderColor === "black" ? "white" : "black";
    const result: GameResult = {
      winner,
      reason: "surrender",
    };

    return {
      game: {
        ...game,
        status: "finished",
        result,
        updatedAt: Date.now(),
      },
      result,
    };
  }

  /**
   * 處理斷線
   */
  static handleDisconnect(game: Game, disconnectedColor: StoneColor): { game: Game; result: GameResult } {
    const winner: StoneColor = disconnectedColor === "black" ? "white" : "black";
    const result: GameResult = {
      winner,
      reason: "disconnect",
    };

    return {
      game: {
        ...game,
        status: "finished",
        result,
        updatedAt: Date.now(),
      },
      result,
    };
  }
}
