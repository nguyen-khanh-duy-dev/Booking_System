class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, errors = null) {
    return new AppError(msg, 400, errors);
  }
  static unauthorized(msg = "Chưa đăng nhập") {
    return new AppError(msg, 401);
  }
  static forbidden(msg = "Không có quyền") {
    return new AppError(msg, 403);
  }
  static notFound(msg = "Không tìm thấy dữ liệu") {
    return new AppError(msg, 404);
  }
  static conflict(msg, errors = null) {
    return new AppError(msg, 409, errors);
  }
}

module.exports = { AppError };
