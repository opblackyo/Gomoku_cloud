/**
 * 主頁 - 大廳頁面
 * 
 * 使用者進入網站後直接顯示大廳介面
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomList, CreateRoomForm, MatchmakingPanel, WaitingRoomModal } from "@/components/lobby";
import { AuthModal } from "@/components/auth";
import { useRoomStore, useGameStore, useUserStore } from "@/stores";
import { socketService } from "@/services/socketService";
import { Room, User } from "@/types";

/**
 * 大廳主頁面
 */
export default function LobbyPage() {
  const router = useRouter();
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState<Room | null>(null);
  
  const { 
    roomList, 
    matchmakingStatus, 
    startMatchmaking, 
    stopMatchmaking,
    setRoomList,
    updateMatchmakingStatus,
    setCurrentRoom,
  } = useRoomStore();

  const { initGame } = useGameStore();

  const {
    user,
    token,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    setUser,
    updateUser,
    setLoading: setAuthLoading,
    setError: setAuthError,
    logout: logoutUser,
  } = useUserStore();

  // 連接 WebSocket 並設置事件監聽
  useEffect(() => {
    const connectAndSetup = async () => {
      try {
        // 先移除舊的監聽器，避免重複註冊
        socketService.removeAllListeners();
        
        await socketService.connect();
        setIsConnected(true);

        // 生成訪客 ID
        const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;

        // 監聽認證結果
        socketService.onLoginResult((result) => {
          console.log("[Auth] Login result:", result);
          if (result.success && result.user && result.token) {
            const fullUser: User = {
              id: result.user.id,
              username: result.user.username,
              displayName: result.user.displayName,
              email: "",
              rating: result.user.rating,
              rank: result.user.rank,
              wins: result.user.wins,
              losses: result.user.losses,
              draws: 0,
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
            };
            setUser(fullUser, result.token);
            setIsAuthOpen(false);
          } else {
            setAuthError(result.message);
          }
        });

        socketService.onRegisterResult((result) => {
          console.log("[Auth] Register result:", result);
          if (result.success && result.user && result.token) {
            const fullUser: User = {
              id: result.user.id,
              username: result.user.username,
              displayName: result.user.displayName,
              email: "",
              rating: result.user.rating,
              rank: result.user.rank,
              wins: result.user.wins,
              losses: result.user.losses,
              draws: 0,
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
            };
            setUser(fullUser, result.token);
            setIsAuthOpen(false);
          } else {
            setAuthError(result.message);
          }
        });

        socketService.onVerifyResult((result) => {
          console.log("[Auth] Verify result:", result);
          if (!result.success) {
            // Token 無效，登出
            logoutUser();
          }
        });

        // 監聯修改暱稱結果
        socketService.onUpdateDisplayNameResult((result) => {
          console.log("[Auth] Update display name result:", result);
          if (result.success && result.user?.displayName) {
            updateUser({ displayName: result.user.displayName });
            alert("暱稱修改成功！");
          } else {
            alert(result.message || "暱稱修改失敗");
          }
        });

        // 如果有保存的 Token，嘗試恢復登入狀態
        if (token) {
          socketService.verifyToken(token);
        }

        // 加入大廳
        socketService.joinLobby(isAuthenticated && user ? user.id : guestId);

        // 監聽房間列表更新
        socketService.onRoomsUpdate((rooms) => {
          console.log("[Lobby] Rooms updated:", rooms);
          setRoomList(rooms);
        });

        // 監聽匹配狀態
        socketService.onMatchmakingStatus((status) => {
          console.log("[Matchmaking] Status:", status);
          updateMatchmakingStatus(status);
        });

        // 監聽匹配成功
        socketService.onMatchFound((room) => {
          console.log("[Matchmaking] Found match:", room);
          setCurrentRoom(room);
          stopMatchmaking();
        });

        // 監聽房間創建成功
        socketService.onRoomCreated((room) => {
          console.log("[Room] Created:", room);
          setCurrentRoom(room);
          setWaitingRoom(room);  // 顯示等待視窗
        });

        // 監聯加入房間成功
        socketService.onRoomJoined((room) => {
          console.log("[Room] Joined:", room);
          setCurrentRoom(room);
        });

        // 監聽有玩家加入房間
        socketService.onPlayerJoined((player) => {
          console.log("[Room] Player joined:", player);
          // 有對手加入時關閉等待視窗
          setWaitingRoom(null);
        });

        // 監聽遊戲開始事件
        socketService.onGameStart((data) => {
          console.log("[Game] Starting:", data);
          // 關閉等待視窗
          setWaitingRoom(null);
          // 使用真實用戶資訊或訪客資訊
          const myInfo = isAuthenticated && user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            rating: user.rating,
            rank: user.rank,
            wins: user.wins,
            losses: user.losses,
          } : {
            id: guestId,
            username: `Player_${guestId.slice(0, 6)}`,
            displayName: `Player_${guestId.slice(0, 6)}`,
            rating: 1000,
            rank: "bronze" as const,
            wins: 0,
            losses: 0,
            isGuest: true,
          };
          // 初始化遊戲，傳入對手資訊和房間ID
          initGame(
            data.gameId, 
            data.yourColor, 
            data.firstMove, 
            data.opponent,
            myInfo,
            data.roomId  // 使用正確的 roomId
          );
          router.push("/game");
        });

        console.log("[Socket] Connected and joined lobby");
      } catch (error) {
        console.error("[Socket] Connection failed:", error);
      }
    };

    connectAndSetup();

    // 清理
    return () => {
      socketService.removeAllListeners();
      socketService.leaveLobby();
    };
  }, [router, setRoomList, updateMatchmakingStatus, setCurrentRoom, stopMatchmaking, initGame, token, isAuthenticated, user, setUser, updateUser, setAuthError, logoutUser]);

  /** 處理登入 */
  const handleLogin = useCallback((username: string, password: string) => {
    setAuthLoading(true);
    socketService.login(username, password);
  }, [setAuthLoading]);

  /** 處理註冊 */
  const handleRegister = useCallback((username: string, password: string, displayName: string) => {
    setAuthLoading(true);
    socketService.register(username, password, displayName);
  }, [setAuthLoading]);

  /** 處理登出 */
  const handleLogout = useCallback(() => {
    socketService.logout();
    logoutUser();
  }, [logoutUser]);

  /** 處理加入房間 */
  const handleJoinRoom = useCallback((roomId: string, hasPassword: boolean) => {
    if (hasPassword) {
      // TODO: 顯示密碼輸入對話框
      const password = prompt("請輸入房間密碼:");
      if (password) {
        socketService.joinRoom(roomId, password);
      }
    } else {
      socketService.joinRoom(roomId);
    }
  }, []);

  /** 處理建立房間 */
  const handleCreateRoom = useCallback((data: {
    name: string;
    type: "public" | "private";
    password?: string;
    config: {
      allowSpectators: boolean;
      turnTimeLimit: number;
      allowUndo: boolean;
    };
  }) => {
    console.log("建立房間:", data);
    socketService.createRoom(data);
    setIsCreateRoomOpen(false);
  }, []);

  /** 處理開始匹配 */
  const handleStartMatchmaking = useCallback(() => {
    startMatchmaking();
    socketService.startMatchmaking();
    console.log("[Matchmaking] Started searching...");
  }, [startMatchmaking]);

  /** 處理取消匹配 */
  const handleCancelMatchmaking = useCallback(() => {
    stopMatchmaking();
    socketService.cancelMatchmaking();
    console.log("[Matchmaking] Cancelled");
  }, [stopMatchmaking]);

  /** 處理離開房間 */
  const handleLeaveRoom = useCallback(() => {
    if (waitingRoom) {
      socketService.leaveRoom(waitingRoom.id);
      setWaitingRoom(null);
      setCurrentRoom(null);
      // 重新加入大廳
      socketService.joinLobby(`guest_${Math.random().toString(36).substring(2, 10)}`);
      console.log("[Room] Left room");
    }
  }, [waitingRoom, setCurrentRoom]);

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 標題區 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ♟️ 五子棋對戰平台
          </h1>
          <p className="text-gray-300">
            即時對戰 · 積分排名 · 公平競技
          </p>
        </header>

        {/* 主內容區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：房間列表 */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span>🏠</span>
                <span>房間列表</span>
                <span className="text-sm font-normal text-gray-400">
                  ({roomList.filter(r => r.status === "waiting").length} 個等待中)
                </span>
              </h2>
              <RoomList
                rooms={roomList}
                isLoading={!isConnected}
                onJoinRoom={handleJoinRoom}
              />
            </div>
          </div>

          {/* 右側：匹配面板 */}
          <div className="lg:col-span-1">
            <MatchmakingPanel
              status={matchmakingStatus}
              onStartMatchmaking={handleStartMatchmaking}
              onCancelMatchmaking={handleCancelMatchmaking}
              onCreateRoom={() => setIsCreateRoomOpen(true)}
            />

            {/* 使用者資訊卡 */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mt-6 border border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-white">👤 我的資訊</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">暱稱</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {isAuthenticated && user ? (user.displayName || user.username) : "訪客玩家"}
                    </span>
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          const newName = prompt("請輸入新暱稱:", user?.displayName || user?.username || "");
                          if (newName && newName.trim()) {
                            socketService.updateDisplayName(newName.trim());
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                        title="修改暱稱"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
                {isAuthenticated && user && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">帳號</span>
                    <span className="font-medium text-gray-500 text-xs">
                      {user.username}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">段位</span>
                  <span className={`font-medium ${getRankColor(isAuthenticated && user ? user.rank : "bronze")}`}>
                    {getRankName(isAuthenticated && user ? user.rank : "bronze")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">積分</span>
                  <span className="font-medium text-white">
                    {isAuthenticated && user ? user.rating : 1000}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">戰績</span>
                  <span className="font-medium text-white">
                    {isAuthenticated && user ? `${user.wins}W / ${user.losses}L` : "0W / 0L"}
                  </span>
                </div>
              </div>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full mt-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  登出
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  登入 / 註冊
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 建立房間表單 */}
      <CreateRoomForm
        isOpen={isCreateRoomOpen}
        onCreate={handleCreateRoom}
        onClose={() => setIsCreateRoomOpen(false)}
      />

      {/* 等待對手加入視窗 */}
      <WaitingRoomModal
        isOpen={waitingRoom !== null}
        room={waitingRoom}
        onLeave={handleLeaveRoom}
      />

      {/* 登入/註冊模態框 */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={authLoading}
        error={authError}
      />
    </main>
  );
}

/** 獲取段位顏色 */
function getRankColor(rank: string): string {
  const colors: Record<string, string> = {
    bronze: "text-amber-600",
    silver: "text-gray-400",
    gold: "text-yellow-400",
    platinum: "text-cyan-400",
    diamond: "text-blue-400",
    master: "text-purple-400",
    apex: "text-red-400",
  };
  return colors[rank] || "text-white";
}

/** 獲取段位名稱 */
function getRankName(rank: string): string {
  const names: Record<string, string> = {
    bronze: "🥉 銅牌",
    silver: "🥈 銀牌",
    gold: "🥇 金牌",
    platinum: "💎 白金",
    diamond: "💠 鑽石",
    master: "👑 大師",
    apex: "🏆 頂級",
  };
  return names[rank] || rank;
}
