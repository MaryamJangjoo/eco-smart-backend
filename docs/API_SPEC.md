# API_SPEC.md

## Status

* **Version:** 1.0.0
* **Date:** July 01, 2026
* **Classification:** Proprietary / Confidential
* **Author:** Principal API & Gateway Architect
* **Target Audience:** Frontend Developers (Blazor WASM Team), Backend Core Engineers, QA Automation Teams

---

## 1. Global Architectural Conventions

* **Base Protocol Layer:** تمام ارتباطات بیرونی از بستر مروگر به گیت‌وی ملزم به استفاده از پروتکل **HTTPS (TLS 1.3)** هستند.
* **Payload Format:** تبادل داده‌ها منحصراً در قالب استاندارد `application/json` انجام می‌شود.
* **Global Tenant Injection:** شناسه سازمان (`X-Organization-Id`) **MUST** در هدر تمام درخواست‌های محافظت‌شده ارسال شود. گیت‌وی قبل از ارجاع ریکوئست به NestJS Core، صحت تعلق توکن کاربر به سازمان مربوطه را اعتبارسنجی می‌کند.

---

## 2. Global HTTP Status Code & Error Envelope

در صورت بروز هرگونه خطا در لایه اعتبارسنجی DTO یا خطاهای دامنه‌ای، ساختار پاسخ خروجی گیت‌وی الزاما باید از فرمت یکپارچه زیر پیروی کند:

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "INVALID_HARDWARE_MAC",
  "message": "The provided MAC address does not conform to standard IEEE 802 format.",
  "timestamp": "2026-07-01T08:42:47Z",
  "path": "/api/v1/auth/register",
  "correlationId": "uuidv4-trace-string"
}

```

---

## 3. Core API Endpoints Specifications

### 3.1. Authentication Layer Context

#### `POST /api/v1/auth/register`

* **توصیف:** ثبت‌نام کاربر جدید ذیل ساختار یک سازمان.
* **لایه دسترسی:** صادرکننده باید نقش `Admin` داشته باشد.
* **Request Headers:**
* `X-Organization-Id`: `UUIDv7`


* **Request Body (RegisterDto):**

```json
{
  "username": "operator_shiraz",
  "email": "operator@ecosmart-iaushiraz.ac.ir",
  "password": "SecurePassword@2026",
  "role": "operator"
}

```

* **Success Response (`201 Created`):**

```json
{
  "success": true,
  "data": {
    "userId": "018f67c2-1234-7000-8000-000000000001",
    "username": "operator_shiraz",
    "role": "operator",
    "createdAt": "2026-07-01T08:42:47Z"
  }
}

```

#### `POST /api/v1/auth/login`

* **توصیف:** تبادل اطلاعات کاربری با توکن‌های امنیتی دوگانه (Access & Refresh).
* **لایه دسترسی:** عمومی (Public).
* **Request Body (LoginDto):**

```json
{
  "username": "operator_shiraz",
  "password": "SecurePassword@2026"
}

```

* **Success Response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}

```

---

### 3.2. Device Management Context

#### `POST /api/v1/devices/provision`

* **توصیف:** جفت‌سازی امن سخت‌افزار ثبت‌شده و فعال‌سازی مکانیسم ECDH لایه لبه.
* **لایه دسترسی:** `Admin` یا `Operator`.
* **Request Body:**

```json
{
  "hardwareMac": "00:1A:2B:3C:4D:5E",
  "roomId": "018f67c2-5678-7000-8000-000000000002"
}

```

* **Success Response (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "deviceId": "018f67c2-abcd-7000-8000-000000000003",
    "clientId": "ECO-SMART-GW-01",
    "provisionStatus": "PROVISIONED",
    "establishedAt": "2026-07-01T08:42:47Z"
  }
}

```

---

## 4. Rate Limiting & Gateway Shield Constraints

* **Authentication Endpoints:** سقف درخواست مجاز برای متدهای `/auth/login` و `/auth/refresh` حداکثر **۵ درخواست در دقیقه** به ازای هر IP فیزیکی است. عبور از این مرز منجر به خطای `429 Too Many Requests` خواهد شد.
* **Global API Budget:** هیچ درخواستی در لایه وب نباید واکشی حجم عظیمی از داده‌های آرشیوی تلمتری را بدون پارامترهای محدودکننده (`limit` و `page`) مجاز بداند. سقف پیش‌فرض لایه مانیتورینگ واکشی حداکثر ۵۰۰ رکورد در هر ریکوئست است.

---