# لیست موجودی و وضعیت ماژول‌های پروژه (Module Inventory)

این سند وضعیت واقعی تمام کامپوننت‌های موجود در دایرکتوری `src/core/modules` و فایل‌های اشتراکی را بر اساس شواهد قطعی سیستم ثبت کرده و مقصد آن‌ها را در معماری پلتفرم مشخص می‌کند.

## 📊 ماتریس وضعیت و نگاشت قطعی (Inventory Matrix)

| مسیر فعلی فایل/ماژول (AS-IS) | ماهیت کامپوننت | موقعیت مقصد (TO-BE) | وضعیت اقدام (Status) |
| :--- | :--- | :--- | :--- |
| `src/main.ts` | Technical Bootstrap | `src/application/main.ts` | آماده انتقال در فاز ۰ |
| `src/app.module.ts` | Technical Bootstrap | `src/application/app.module.ts` | آماده انتقال در فاز ۰ |
| `src/core/health/` | Technical (Core) | `src/core/health/` | تثبیت و حفظ موقعیت |
| `src/core/config/` | Technical (Core) | `src/core/config/` | تثبیت و حفظ موقعیت |
| `src/core/shared/database.service.ts` | Infrastructure | `src/core/database/` | تفکیک به لایه دیتابیس فنی |
| `src/core/shared/cache.service.ts` | Technical (Core) | `src/core/shared/` یا `infrastructure/redis` | نیازمند بررسی وابستگی‌ها |
| `src/core/shared/logging.service.ts` | Technical (Core) | `src/core/logger/` | انتقال به کامپوننت اختصاصی لاگر |
| `src/core/shared/notification.service.ts`| Platform Business | `src/platform/notifications/` | انتقال به سرویس‌های پلتفرم |
| `src/core/modules/*` (انتیتی‌ها و ماژول‌های احراز هویت/کاربران)* | Platform Business | `src/platform/identity/` | ارزیابی قطعی در فاز ۱ |
| `src/core/modules/*` (کدهای اتوماسیون و سخت‌افزار)* | Product Business | `src/products/eco-smart/modules/` | ارزیابی قطعی در فاز ۳ |

> * **نکته:** محتویات دقیق داخل پوشه `src/core/modules/` پس از خروجی گرفتن دستور `dir` یا `ls` در گام بعدی، به صورت تک‌به‌تک در این جدول ثبت قطعی خواهند شد.
