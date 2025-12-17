/**
 * 遊戲對戰頁面
 * 
 * 顯示五子棋盤、雙方資訊、計時器和互動按鈕
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  GameBoard, 
  PlayerInfo, 
  GameControls, 
  GameResultModal 
} from "@/components/game";
import { useGameStore, useUserStore } from "@/stores";
import { Position } from "@/types";
import { checkWin } from "@/lib/gameLogic";
import { socketService } from "@/services/socketService";

/**
 * 遊戲對戰頁面元件
 */
export default function GamePage() {
  const router = useRouter();
  const [showResultModal, setShowResultModal] = useState(false);
  
  const {
    gameId,
    board,
    currentTurn,
    myColor,
    opponent,
    myInfo,
    roomId,
    moves,
    isPlaying,
    result,
    turnTimeRemaining,
    pendingUndoRequest,
    pendingRematchRequest,
    makeMove,
    setResult,
    switchTurn,
    updateTurnTime,
    setPendingUndoRequest,
    setPendingRematchRequest,
    updateMyInfo,
    resetGame,
  } = useGameStore();

  // 獲取 userStore 用於更新用戶資料
  const { isAuthenticated, updateUser } = useUserStore();

  // 再來一局請求彈窗
  const [showRematchRequest, setShowRematchRequest] = useState(false);
  // 悔棋請求彈窗
  const [showUndoRequest, setShowUndoRequest] = useState(false);

  // 獲取 initGame 用於再來一局
  const initGame = useGameStore((state) => state.initGame);
  // 獲取 undoMoves 用於悔棋
  const undoMoves = useGameStore((state) => state.undoMoves);

  // 設置 WebSocket 監聽
  useEffect(() => {
    // 監聯 game:start 事件（再來一局時會觸發）
    socketService.onGameStart((data) => {
      console.log("[Game] Game start (rematch):", data);
      initGame(
        data.gameId,
        data.yourColor,
        data.firstMove,
        data.opponent,
        myInfo || undefined,
        data.roomId
      );
      setShowResultModal(false);
      setShowRematchRequest(false);
    });

    // 監聽落子廣播
    socketService.onMoveMade((move) => {
      console.log("[Game] Move received:", move);
      // 只有對手的落子需要更新本地棋盤
      // 自己的落子已經在 handleMove 中處理過了
      if (move.color !== myColor) {
        makeMove(move.position, move.color);
        switchTurn();
      }
      // 自己的落子不需要再處理（已在 handleMove 中處理）
    });

    // 監聽回合更新
    socketService.onTurnUpdate((data) => {
      updateTurnTime(data.timeRemaining);
    });

    // 監聽遊戲結束
    socketService.onGameEnd((gameResult) => {
      console.log("[Game] Game ended:", gameResult);
      setResult(gameResult);
    });

    // 監聽對方請求悔棋
    socketService.onUndoRequested((data) => {
      console.log("[Game] Undo requested by:", data.requesterId);
      setShowUndoRequest(true);
    });

    // 監聽悔棋結果
    socketService.onUndoResult((data) => {
      console.log("[Game] Undo result:", data);
      setPendingUndoRequest(false);
      setShowUndoRequest(false);
      
      if (data.accepted && data.removedMoves) {
        // 悔棋成功，移除棋子
        undoMoves(data.removedMoves.length);
      }
    });

    // 監聽對方請求再來一局
    socketService.onRematchRequested((data) => {
      console.log("[Game] Rematch requested by:", data.requesterId);
      setShowRematchRequest(true);
    });

    // 監聽再來一局結果
    socketService.onRematchResult((data) => {
      console.log("[Game] Rematch result:", data);
      setPendingRematchRequest(false);
      setShowRematchRequest(false);
      
      if (data.accepted) {
        // 重置遊戲狀態，等待 game:start 事件
        setShowResultModal(false);
      }
    });

    // 監聽玩家統計更新
    socketService.onStatsUpdate((data) => {
      console.log("[Game] Stats update:", data);
      // 更新遊戲中的資訊
      updateMyInfo({
        rating: data.rating,
        wins: data.wins,
        losses: data.losses,
        rank: data.rank as "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "apex",
      });
      // 如果是已登入用戶，也更新 userStore
      if (isAuthenticated) {
        updateUser({
          rating: data.rating,
          wins: data.wins,
          losses: data.losses,
          rank: data.rank as "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "apex",
        });
      }
    });

    return () => {
      // 清理監聽器，避免重複觸發
      socketService.removeGameListeners();
    };
  }, [myColor, myInfo, makeMove, switchTurn, updateTurnTime, setResult, setPendingUndoRequest, setPendingRematchRequest, updateMyInfo, initGame, undoMoves, isAuthenticated, updateUser]);

  // 如果沒有遊戲資訊，返回大廳
  useEffect(() => {
    if (!gameId && !isPlaying) {
      // 給一點時間讓 store 初始化
      const timer = setTimeout(() => {
        if (!gameId) {
          router.push("/");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameId, isPlaying, router]);

  // 顯示結果彈窗
  useEffect(() => {
    if (result) {
      setShowResultModal(true);
    }
  }, [result]);

  /** 處理落子 */
  const handleMove = useCallback((position: Position) => {
    if (!isPlaying || !myColor || currentTurn !== myColor || !roomId) return;

    // 檢查位置是否為空
    if (board[position.y][position.x] !== null) {
      console.warn("Position is not empty");
      return;
    }

    try {
      // 更新本地棋盤
      makeMove(position, myColor);

      // 發送落子到伺服器
      socketService.makeMove(roomId, position);

      // 檢查勝負
      const newBoard = board.map(row => [...row]);
      newBoard[position.y][position.x] = myColor;
      const winResult = checkWin(newBoard, position, myColor);

      if (winResult.isWin) {
        // 伺服器會發送 game:end 事件
        console.log("[Game] Win detected locally");
      }
      // 自己落子後切換回合
      switchTurn();
    } catch (error) {
      console.error("落子失敗:", error);
    }
  }, [isPlaying, myColor, currentTurn, board, roomId, makeMove, switchTurn]);

  /** 處理悔棋請求 */
  const handleUndo = useCallback(() => {
    if (!roomId) return;
    setPendingUndoRequest(true);
    socketService.requestUndo(roomId);
    console.log("請求悔棋");
  }, [roomId, setPendingUndoRequest]);

  /** 接受悔棋 */
  const handleAcceptUndo = useCallback(() => {
    if (!roomId) return;
    socketService.respondUndo(roomId, true);
    setShowUndoRequest(false);
  }, [roomId]);

  /** 拒絕悔棋 */
  const handleDeclineUndo = useCallback(() => {
    if (!roomId) return;
    socketService.respondUndo(roomId, false);
    setShowUndoRequest(false);
  }, [roomId]);

  /** 處理投降 */
  const handleSurrender = useCallback(() => {
    if (!myColor || !roomId) return;
    socketService.surrender(roomId);
  }, [myColor, roomId]);

  /** 處理再來一局 */
  const handleRematch = useCallback(() => {
    if (!roomId) return;
    setPendingRematchRequest(true);
    socketService.requestRematch(roomId);
    console.log("請求再來一局");
  }, [roomId, setPendingRematchRequest]);

  /** 接受再來一局 */
  const handleAcceptRematch = useCallback(() => {
    if (!roomId) return;
    socketService.respondRematch(roomId, true);
    setShowRematchRequest(false);
  }, [roomId]);

  /** 拒絕再來一局 */
  const handleDeclineRematch = useCallback(() => {
    if (!roomId) return;
    socketService.respondRematch(roomId, false);
    setShowRematchRequest(false);
  }, [roomId]);

  /** 返回大廳 */
  const handleBackToLobby = useCallback(() => {
    resetGame();
    router.push("/");
  }, [resetGame, router]);

  // 獲取最後一步
  const lastMove = moves.length > 0 ? moves[moves.length - 1].position : undefined;

  // 預設玩家資訊（如果沒有從伺服器獲取）
  const defaultMyInfo = myInfo || {
    id: "me",
    username: "我",
    displayName: "我",
    rating: 1000,
    rank: "bronze" as const,
    wins: 0,
    losses: 0,
  };

  const defaultOpponent = opponent || {
    id: "opponent",
    username: "對手",
    displayName: "對手",
    rating: 1000,
    rank: "bronze" as const,
    wins: 0,
    losses: 0,
  };

  return (
    <main className="min-h-screen py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <header className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            ♟️ 五子棋對戰
          </h1>
          {gameId && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1 break-all px-2">
              遊戲 ID: {gameId}
            </p>
          )}
        </header>

        {/* 對手資訊 */}
        <div className="mb-4">
          <PlayerInfo
            player={defaultOpponent}
            color={myColor === "black" ? "white" : "black"}
            isCurrentTurn={currentTurn !== myColor}
            timeRemaining={currentTurn !== myColor ? turnTimeRemaining : undefined}
          />
        </div>

        {/* 棋盤 */}
        <div className="flex justify-center mb-4 px-1">
          <GameBoard
            board={board}
            canPlay={isPlaying}
            currentTurn={currentTurn}
            myColor={myColor}
            winningLine={result?.winningLine}
            lastMove={lastMove}
            onMove={handleMove}
          />
        </div>

        {/* 我的資訊 */}
        <div className="mb-6">
          <PlayerInfo
            player={defaultMyInfo}
            color={myColor || "black"}
            isCurrentTurn={currentTurn === myColor}
            timeRemaining={currentTurn === myColor ? turnTimeRemaining : undefined}
            isMe
          />
        </div>

        {/* 控制面板 */}
        <GameControls
          isPlaying={isPlaying}
          isGameOver={!!result}
          allowUndo={true}
          canUndo={moves.length > 0}
          pendingUndoRequest={pendingUndoRequest}
          pendingRematchRequest={pendingRematchRequest}
          onUndo={handleUndo}
          onSurrender={handleSurrender}
          onRematch={handleRematch}
          onBackToLobby={handleBackToLobby}
        />

        {/* 步數顯示 */}
        <div className="text-center mt-4 text-gray-400">
          第 {moves.length} 步
        </div>
      </div>

      {/* 結果彈窗 */}
      <GameResultModal
        result={result}
        myColor={myColor}
        isOpen={showResultModal}
        pendingRematch={pendingRematchRequest}
        onRematch={handleRematch}
        onBackToLobby={handleBackToLobby}
        onClose={() => setShowResultModal(false)}
      />

      {/* 對方請求悔棋彈窗 */}
      {showUndoRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-white text-center mb-4">
              ↩️ 悔棋請求
            </h3>
            <p className="text-gray-400 text-center mb-6">
              對方想要悔棋，是否同意？
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineUndo}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                拒絕
              </button>
              <button
                onClick={handleAcceptUndo}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
              >
                同意
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 對方請求再來一局彈窗 */}
      {showRematchRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-white text-center mb-4">
              🔄 再來一局？
            </h3>
            <p className="text-gray-400 text-center mb-6">
              對方想要再來一局，是否接受？
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineRematch}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                拒絕
              </button>
              <button
                onClick={handleAcceptRematch}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
              >
                接受
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
