const { AppError } = require("../utils/AppError");
const { utcToVn, minutesOfDay, timeStringToMinutes } = require("../utils/time");
const pricingModel = require("../models/pricing.model");

/** Thứ 7 (6) và Chủ nhật (7) theo luxon */
const getDayType = (dt) => (dt.weekday >= 6 ? "WEEKEND" : "WEEKDAY");

const findRule = (rules, dt) => {
  const dayType = getDayType(dt);
  const mins = minutesOfDay(dt);
  return rules.find(
    (r) =>
      r.day_type === dayType &&
      mins >= timeStringToMinutes(r.start_time) &&
      mins < timeStringToMinutes(r.end_time), // nửa mở: [start, end)
  );
};

/** Cộng dồn từng khung giờ mà booking đi qua (BR-22) */
const calculateTotal = (rules, startUtc, endUtc, slotMinutes) => {
  const durationMin = (endUtc - startUtc) / 60000;
  if (durationMin % slotMinutes !== 0) {
    throw AppError.badRequest("Thời lượng không chia hết cho độ dài khung giờ");
  }

  let total = 0;
  let cursor = utcToVn(startUtc);
  const end = utcToVn(endUtc);

  while (cursor < end) {
    const rule = findRule(rules, cursor);
    if (!rule) {
      throw AppError.conflict(
        `Chưa có bảng giá cho khung ${cursor.toFormat("cccc HH:mm")}`,
      );
    }
    total += Number(rule.price_per_hour) * (slotMinutes / 60);
    cursor = cursor.plus({ minutes: slotMinutes });
  }
  return total;
};

const getPricing = async (courtId) => {
  return await pricingModel.findByCourt(courtId);
};

const replacePricing = async (courtId, rules) => {
  // 1. Validate TRƯỚC, khi chưa động vào DB
  const court = await courtModel.findById(courtId);
  if (!court) throw AppError.notFound("Không tìm thấy sân");
  if (!Array.isArray(rules) || rules.length === 0) {
    throw AppError.badRequest("Danh sách bảng giá không được rỗng");
  }
  validateRuleSet(rules, court);

  // 2. Transaction chỉ bọc phần ghi dữ liệu
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await pricingModel.deleteByCourt(courtId, conn);
    await pricingModel.bulkInsert(courtId, rules, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // 3. Đọc lại sau khi commit — không cần conn nữa
  return await pricingModel.findByCourt(courtId);
};

module.exports = { calculateTotal, getPricing, replacePricing };
