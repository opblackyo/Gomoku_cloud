/**
 * 遊戲常數配置
 * 
 * 遵循配置與硬編碼原則，所有遊戲相關常數集中管理
 */

/** 棋盤尺寸 */
export const BOARD_SIZE = 15;

/** 勝利所需連續棋子數 */
export const WIN_CONDITION = 5;

/** 預設每步時限（秒） */
export const DEFAULT_TURN_TIME_LIMIT = 60;

/** 可選時限選項（秒） */
export const TURN_TIME_OPTIONS = [30, 60, 120, 300];

/** 快捷表情列表 */
export const QUICK_EMOJIS = [
  "👍", "👎", "😊", "😢", "🎉",
  "🤔", "😮", "💪", "🙏", "✨"
];

/** 快捷短語 */
export const QUICK_PHRASES = [
  "Good game!",
  "Well played!",
  "Nice move!",
  "Let me think...",
  "GG",
];
