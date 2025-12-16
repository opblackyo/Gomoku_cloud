/**
 * 匹配系統服務
 * 
 * 負責玩家匹配邏輯
 */

import { MatchmakingEntry, PublicUserInfo } from "../types";
import { 
  INITIAL_RATING_RANGE, 
  RATING_RANGE_EXPANSION, 
  MATCHMAKING_EXPAND_INTERVAL 
} from "../constants";

/**
 * 匹配服務類
 */
export class MatchmakingService {
  /** 匹配隊列 */
  private queue: Map<string, MatchmakingEntry> = new Map();

  /**
   * 加入匹配隊列
   */
  joinQueue(socketId: string, user: PublicUserInfo): void {
    if (this.queue.has(socketId)) {
      throw new Error("Already in queue");
    }

    const entry: MatchmakingEntry = {
      socketId,
      user,
      joinedAt: Date.now(),
      ratingRange: {
        min: user.rating - INITIAL_RATING_RANGE,
        max: user.rating + INITIAL_RATING_RANGE,
      },
    };

    this.queue.set(socketId, entry);
  }

  /**
   * 離開匹配隊列
   */
  leaveQueue(socketId: string): boolean {
    return this.queue.delete(socketId);
  }

  /**
   * 檢查玩家是否在隊列中
   */
  isInQueue(socketId: string): boolean {
    return this.queue.has(socketId);
  }

  /**
   * 嘗試尋找匹配
   * @returns 匹配成功的兩個玩家，或 null
   */
  findMatch(socketId: string): [MatchmakingEntry, MatchmakingEntry] | null {
    const entry = this.queue.get(socketId);
    if (!entry) return null;

    // 更新積分範圍（隨時間擴大）
    this.updateRatingRange(entry);

    // 尋找符合條件的對手
    for (const [otherSocketId, otherEntry] of this.queue) {
      if (otherSocketId === socketId) continue;

      // 更新對方的積分範圍
      this.updateRatingRange(otherEntry);

      // 檢查雙向匹配
      if (this.isMatchable(entry, otherEntry)) {
        // 移除雙方
        this.queue.delete(socketId);
        this.queue.delete(otherSocketId);
        return [entry, otherEntry];
      }
    }

    return null;
  }

  /**
   * 處理所有匹配（由定時器調用）
   * @returns 所有成功匹配的配對
   */
  processAllMatches(): Array<[MatchmakingEntry, MatchmakingEntry]> {
    const matches: Array<[MatchmakingEntry, MatchmakingEntry]> = [];
    const processed = new Set<string>();

    for (const [socketId, entry] of this.queue) {
      if (processed.has(socketId)) continue;

      this.updateRatingRange(entry);

      for (const [otherSocketId, otherEntry] of this.queue) {
        if (otherSocketId === socketId || processed.has(otherSocketId)) continue;

        this.updateRatingRange(otherEntry);

        if (this.isMatchable(entry, otherEntry)) {
          matches.push([entry, otherEntry]);
          processed.add(socketId);
          processed.add(otherSocketId);
          break;
        }
      }
    }

    // 移除已匹配的玩家
    for (const socketId of processed) {
      this.queue.delete(socketId);
    }

    return matches;
  }

  /**
   * 更新積分範圍
   */
  private updateRatingRange(entry: MatchmakingEntry): void {
    const elapsed = Date.now() - entry.joinedAt;
    const expansions = Math.floor(elapsed / MATCHMAKING_EXPAND_INTERVAL);
    const expansion = expansions * RATING_RANGE_EXPANSION;

    entry.ratingRange = {
      min: entry.user.rating - INITIAL_RATING_RANGE - expansion,
      max: entry.user.rating + INITIAL_RATING_RANGE + expansion,
    };
  }

  /**
   * 檢查兩個玩家是否可以匹配
   */
  private isMatchable(
    entry1: MatchmakingEntry,
    entry2: MatchmakingEntry
  ): boolean {
    // 雙向檢查：兩個玩家都要在對方的範圍內
    const entry1InRange =
      entry2.user.rating >= entry1.ratingRange.min &&
      entry2.user.rating <= entry1.ratingRange.max;

    const entry2InRange =
      entry1.user.rating >= entry2.ratingRange.min &&
      entry1.user.rating <= entry2.ratingRange.max;

    return entry1InRange && entry2InRange;
  }

  /**
   * 獲取隊列長度
   */
  getQueueLength(): number {
    return this.queue.size;
  }

  /**
   * 獲取預估等待時間（秒）
   */
  getEstimatedWaitTime(socketId: string): number {
    const entry = this.queue.get(socketId);
    if (!entry) return 0;

    // 簡單估算：隊列越長，等待時間越短
    const queueLength = this.queue.size;
    if (queueLength <= 1) return 30;
    if (queueLength <= 5) return 15;
    return 5;
  }
}
