// src/utils/pagination.js
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toPositiveInt = (value, defaultValue) => {
  const num = Number.parseInt(value, 10);
  return Number.isSafeInteger(num) && num >= 1 ? num : defaultValue;
};

const toBoolean = (value) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return undefined;
};

/** { page: '2', limit: '999' } -> { page: 2, limit: 100, offset: 100 } */
const normalizePaging = ({ page, limit } = {}) => {
  const safePage = toPositiveInt(page, DEFAULT_PAGE);
  const safeLimit = Math.min(toPositiveInt(limit, DEFAULT_LIMIT), MAX_LIMIT);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

module.exports = { normalizePaging, toBoolean, toPositiveInt };
