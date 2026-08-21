import { DateTime } from "luxon";

export const ZONE = "Asia/Ho_Chi_Minh";

/** '2026-08-20' + '18:00:00' (giờ VN) -> Date object ở UTC để lưu DB */
export function vnToUtc(dateStr, timeStr) {
  return DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: ZONE })
    .toUTC()
    .toJSDate();
}

/** Date từ DB (UTC) -> DateTime giờ VN để hiển thị hoặc so sánh giờ treo tường */
export function utcToVn(date) {
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone(ZONE);
}

/** Số phút kể từ 00:00 — dùng để so sánh giờ treo tường với TIME trong DB */
export function minutesOfDay(dt) {
  return dt.hour * 60 + dt.minute;
}

/** '17:00:00' -> 1020 */
export function timeStringToMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}
