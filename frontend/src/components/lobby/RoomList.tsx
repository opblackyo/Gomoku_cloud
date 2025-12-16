/**
 * 房間列表元件
 * 
 * 顯示大廳中的可加入房間
 */

"use client";

import { cn } from "@/lib/utils";
import { RoomListItem } from "@/types";

interface RoomListProps {
  /** 房間列表 */
  rooms: RoomListItem[];
  /** 是否載入中 */
  isLoading: boolean;
  /** 加入房間回調 */
  onJoinRoom: (roomId: string, hasPassword: boolean) => void;
}

/**
 * 房間列表元件
 */
export function RoomList({ rooms, isLoading, onJoinRoom }: RoomListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-slate-700/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300 text-lg">目前沒有可加入的房間</p>
        <p className="text-gray-500 text-sm mt-2">
          建立一個房間或開始隨機匹配吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onJoin={() => onJoinRoom(room.id, room.hasPassword)}
        />
      ))}
    </div>
  );
}

interface RoomCardProps {
  room: RoomListItem;
  onJoin: () => void;
}

/**
 * 單一房間卡片
 */
function RoomCard({ room, onJoin }: RoomCardProps) {
  const statusText = {
    waiting: "等待中",
    ready: "準備中",
    playing: "遊戲中",
    finished: "已結束",
  };

  const statusColor = {
    waiting: "text-green-400 bg-green-900/50",
    ready: "text-yellow-400 bg-yellow-900/50",
    playing: "text-blue-400 bg-blue-900/50",
    finished: "text-gray-400 bg-gray-700/50",
  };

  const canJoin = room.status === "waiting";

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600",
        "hover:bg-slate-700 transition-all"
      )}
    >
      {/* 房間信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold truncate text-white">{room.name}</h3>
          {room.hasPassword && (
            <span className="text-gray-400" title="需要密碼">
              🔒
            </span>
          )}
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              statusColor[room.status]
            )}
          >
            {statusText[room.status]}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          <span>房主: {room.hostUsername}</span>
          <span className="mx-2">•</span>
          <span>Rating: {room.hostRating}</span>
          {room.spectatorCount > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>👁 {room.spectatorCount}</span>
            </>
          )}
        </div>
      </div>

      {/* 加入按鈕 */}
      <button
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-colors ml-4",
          canJoin
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-slate-600 text-gray-400 cursor-not-allowed"
        )}
        disabled={!canJoin}
        onClick={onJoin}
      >
        {canJoin ? "加入" : statusText[room.status]}
      </button>
    </div>
  );
}
