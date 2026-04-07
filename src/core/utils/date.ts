/**
 * 統一日期處理工具：確保系統使用的日期皆為台北時間 (UTC+8)
 */
export function toTaipeiDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).replace(/\//g, '-');
}

/**
 * 取得 N 天前的台北日期字串
 */
export function getDaysAgo(days: number, from: Date = new Date()): string {
  const target = new Date(from);
  target.setDate(target.getDate() - days);
  return toTaipeiDateString(target);
}
