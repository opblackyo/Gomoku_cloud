/**
 * 房間管理服務
 * 
 * 負責房間的建立、加入、離開等管理功能
 */

import { v4 as uuidv4 } from "uuid";
import { 
  Room, 
  RoomListItem, 
  RoomConfig, 
  RoomType, 
  PublicUserInfo 
} from "../types";
import { GameService } from "./GameService";
import { MAX_ROOMS } from "../constants";

/**
 * 房間管理服務類
 */
export class RoomService {
  /** 房間存儲 */
  private rooms: Map<string, Room> = new Map();

  /**
   * 建立新房間
   */
  createRoom(
    name: string,
    type: RoomType,
    config: RoomConfig,
    host: PublicUserInfo,
    hostSocketId: string
  ): Room {
    // 檢查房間數量限制
    if (this.rooms.size >= MAX_ROOMS) {
      throw new Error("Maximum room limit reached");
    }

    const room: Room = {
      id: uuidv4(),
      name,
      type,
      status: "waiting",
      config,
      host,
      hostSocketId,
      spectators: new Map(),
      createdAt: Date.now(),
    };

    this.rooms.set(room.id, room);
    return room;
  }

  /**
   * 獲取房間
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 獲取房間列表（用於大廳顯示）
   */
  getRoomList(): RoomListItem[] {
    const list: RoomListItem[] = [];

    this.rooms.forEach((room) => {
      // 只顯示等待中的房間
      if (room.status === "waiting" || room.status === "playing") {
        list.push({
          id: room.id,
          name: room.name,
          type: room.type,
          status: room.status,
          hostUsername: room.host.username,
          hostRating: room.host.rating,
          hasPassword: !!room.config.password,
          spectatorCount: room.spectators.size,
          createdAt: room.createdAt,
        });
      }
    });

    // 按建立時間排序
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 加入房間
   */
  joinRoom(
    roomId: string,
    player: PublicUserInfo,
    playerSocketId: string,
    password?: string
  ): Room {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "waiting") {
      throw new Error("Room is not accepting players");
    }

    if (room.guest) {
      throw new Error("Room is full");
    }

    // 檢查密碼
    if (room.config.password && room.config.password !== password) {
      throw new Error("Incorrect password");
    }

    // 加入為對手
    room.guest = player;
    room.guestSocketId = playerSocketId;
    room.status = "ready";

    return room;
  }

  /**
   * 以觀戰者身份加入
   */
  joinAsSpectator(
    roomId: string,
    spectator: PublicUserInfo,
    socketId: string
  ): Room {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.config.allowSpectators) {
      throw new Error("Spectators not allowed");
    }

    room.spectators.set(socketId, spectator);
    return room;
  }

  /**
   * 開始遊戲
   */
  startGame(roomId: string): Room {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "ready") {
      throw new Error("Room is not ready to start");
    }

    if (!room.guest) {
      throw new Error("Need two players to start");
    }

    room.currentGame = GameService.createGame(roomId, room.config.turnTimeLimit);
    room.status = "playing";

    return room;
  }

  /**
   * 離開房間
   */
  leaveRoom(roomId: string, socketId: string): { room: Room | null; wasHost: boolean; wasGuest: boolean } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { room: null, wasHost: false, wasGuest: false };
    }

    let wasHost = false;
    let wasGuest = false;

    // 檢查是否為房主
    if (room.hostSocketId === socketId) {
      wasHost = true;
      // 如果有對手，對手成為新房主
      if (room.guest && room.guestSocketId) {
        room.host = room.guest;
        room.hostSocketId = room.guestSocketId;
        room.guest = undefined;
        room.guestSocketId = undefined;
        room.status = "waiting";
      } else {
        // 沒有其他玩家，刪除房間
        this.rooms.delete(roomId);
        return { room: null, wasHost: true, wasGuest: false };
      }
    } 
    // 檢查是否為對手
    else if (room.guestSocketId === socketId) {
      wasGuest = true;
      room.guest = undefined;
      room.guestSocketId = undefined;
      room.status = "waiting";
    } 
    // 檢查是否為觀戰者
    else {
      room.spectators.delete(socketId);
    }

    return { room, wasHost, wasGuest };
  }

  /**
   * 刪除房間
   */
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  /**
   * 更新房間遊戲狀態
   */
  updateGame(roomId: string, updater: (room: Room) => Room): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const updatedRoom = updater(room);
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * 結束遊戲後重置房間
   */
  resetRoomForRematch(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // 交換先後手
    if (room.guest && room.guestSocketId) {
      const tempHost = room.host;
      const tempHostSocketId = room.hostSocketId;
      room.host = room.guest;
      room.hostSocketId = room.guestSocketId;
      room.guest = tempHost;
      room.guestSocketId = tempHostSocketId;
    }

    room.currentGame = undefined;
    room.status = "ready";

    return room;
  }

  /**
   * 獲取玩家在房間中的顏色
   */
  getPlayerColor(room: Room, socketId: string): "black" | "white" | null {
    if (room.hostSocketId === socketId) {
      return "black"; // 房主執黑
    }
    if (room.guestSocketId === socketId) {
      return "white"; // 對手執白
    }
    return null;
  }

  /**
   * 獲取房間統計
   */
  getStats(): { totalRooms: number; waitingRooms: number; playingRooms: number } {
    let waiting = 0;
    let playing = 0;

    this.rooms.forEach((room) => {
      if (room.status === "waiting") waiting++;
      if (room.status === "playing") playing++;
    });

    return {
      totalRooms: this.rooms.size,
      waitingRooms: waiting,
      playingRooms: playing,
    };
  }
}
