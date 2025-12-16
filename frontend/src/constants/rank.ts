/**
 * 段位系統配置
 * 
 * 定義各段位的積分範圍和顯示資訊
 */

import { RankConfig, Rank } from "@/types";

/** 段位配置列表 */
export const RANK_CONFIGS: RankConfig[] = [
  {
    name: "bronze",
    displayName: "銅牌 Bronze",
    minRating: 0,
    maxRating: 999,
    color: "#CD7F32",
  },
  {
    name: "silver",
    displayName: "銀牌 Silver",
    minRating: 1000,
    maxRating: 1199,
    color: "#C0C0C0",
  },
  {
    name: "gold",
    displayName: "金牌 Gold",
    minRating: 1200,
    maxRating: 1399,
    color: "#FFD700",
  },
  {
    name: "platinum",
    displayName: "白金 Platinum",
    minRating: 1400,
    maxRating: 1599,
    color: "#E5E4E2",
  },
  {
    name: "diamond",
    displayName: "鑽石 Diamond",
    minRating: 1600,
    maxRating: 1799,
    color: "#B9F2FF",
  },
  {
    name: "master",
    displayName: "大師 Master",
    minRating: 1800,
    maxRating: 1999,
    color: "#FF4500",
  },
  {
    name: "apex",
    displayName: "頂級 Apex",
    minRating: 2000,
    maxRating: Infinity,
    color: "#9400D3",
  },
];

/**
 * 根據積分獲取對應段位
 * @param rating - 玩家積分
 * @returns 對應的段位
 */
export function getRankByRating(rating: number): Rank {
  const config = RANK_CONFIGS.find(
    (r) => rating >= r.minRating && rating <= r.maxRating
  );
  return config?.name || "bronze";
}

/**
 * 獲取段位配置
 * @param rank - 段位名稱
 * @returns 段位配置
 */
export function getRankConfig(rank: Rank): RankConfig {
  return RANK_CONFIGS.find((r) => r.name === rank) || RANK_CONFIGS[0];
}
