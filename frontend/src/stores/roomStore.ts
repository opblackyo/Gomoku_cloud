/**
 * 房間與大廳狀態管理
 */

import { create } from "zustand";
import { Room, RoomListItem, MatchmakingStatus } from "@/types";

interface RoomState {
  /** 當前房間 */
  currentRoom: Room | null;
  /** 大廳房間列表 */
  roomList: RoomListItem[];
  /** 匹配狀態 */
  matchmakingStatus: MatchmakingStatus;
  /** 是否在大廳中 */
  isInLobby: boolean;
}

interface RoomActions {
  /** 設置當前房間 */
  setCurrentRoom: (room: Room | null) => void;
  /** 更新房間列表 */
  setRoomList: (rooms: RoomListItem[]) => void;
  /** 開始匹配 */
  startMatchmaking: () => void;
  /** 停止匹配 */
  stopMatchmaking: () => void;
  /** 更新匹配狀態 */
  updateMatchmakingStatus: (status: Partial<MatchmakingStatus>) => void;
  /** 設置大廳狀態 */
  setInLobby: (inLobby: boolean) => void;
  /** 離開房間 */
  leaveRoom: () => void;
}

const initialMatchmakingStatus: MatchmakingStatus = {
  isSearching: false,
  estimatedWaitTime: undefined,
  searchStartedAt: undefined,
};

/**
 * 房間狀態 Store
 */
export const useRoomStore = create<RoomState & RoomActions>((set) => ({
  currentRoom: null,
  roomList: [],
  matchmakingStatus: initialMatchmakingStatus,
  isInLobby: false,

  setCurrentRoom: (room) => {
    set({ currentRoom: room });
  },

  setRoomList: (rooms) => {
    set({ roomList: rooms });
  },

  startMatchmaking: () => {
    set({
      matchmakingStatus: {
        isSearching: true,
        searchStartedAt: Date.now(),
      },
    });
  },

  stopMatchmaking: () => {
    set({
      matchmakingStatus: initialMatchmakingStatus,
    });
  },

  updateMatchmakingStatus: (status) => {
    set((state) => ({
      matchmakingStatus: { ...state.matchmakingStatus, ...status },
    }));
  },

  setInLobby: (inLobby) => {
    set({ isInLobby: inLobby });
  },

  leaveRoom: () => {
    set({ currentRoom: null });
  },
}));
