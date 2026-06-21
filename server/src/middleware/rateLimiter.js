import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // ۱۵ دقیقه
    max: 8,                      // حداکثر ۸ تلاش
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "تعداد تلاش‌های مجاز تجاوز شد. ۱۵ دقیقه دیگر امتحان کنید." },
});

export const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // ۱ ساعت
    max: 5,                      // حداکثر ۵ نظر در ساعت
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "تعداد مجاز نظرات در این ساعت تجاوز شد. بعداً دوباره امتحان کنید." },
});
