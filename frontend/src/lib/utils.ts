/**
 * CSS 類名工具函數
 * 
 * 用於合併 Tailwind CSS 類名
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合併 CSS 類名，處理 Tailwind 衝突
 * @param inputs - 類名參數
 * @returns 合併後的類名字串
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
