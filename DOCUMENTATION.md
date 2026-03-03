# Tea Dealer App — Developer Documentation

> **Keep this file up to date whenever logic, calculations, or configurations change.**

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Data Models](#4-data-models)
5. [Core Business Flow](#5-core-business-flow)
6. [Collection Recording](#6-collection-recording)
7. [Invoice Generation — Full Calculation Walkthrough](#7-invoice-generation--full-calculation-walkthrough)
8. [Rounding Modes](#8-rounding-modes)
9. [Stamp Fee Modes](#9-stamp-fee-modes)
10. [Number Formatting Rules](#10-number-formatting-rules)
11. [Invoice Template System](#11-invoice-template-system)
12. [Configurations Reference](#12-configurations-reference)
13. [Pages Reference](#13-pages-reference)
14. [Settings Keys Reference](#14-settings-keys-reference)
15. [Changelog](#15-changelog)

---

## 1. App Overview

The Tea Dealer App is a business management system for tea leaf collection dealers. It manages the full workflow from daily collection recording through monthly invoicing and payment tracking.

**Primary workflow:**
1. Tea leaves are collected daily from grower customers in two grades.
2. Weights per grade are recorded each day.
3. At month end, invoices are generated based on collected amounts, configured rates, and customer-specific deductions.
4. Invoices are printed on pre-printed forms using a custom template.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java Spring Boot, JPA/Hibernate |
| Database | MySQL |
| Frontend | React 18, Tailwind CSS |
| State management | React Context |
| Internationalisation | react-i18next (English / Sinhala) |
| Icons | Lucide React |

---

## 3. Project Structure

```
Tea Dealer App/
├── tea-dealer-backend/
│   └── src/main/java/com/teadealer/
│       ├── model/           # JPA entities
│       ├── repository/      # Spring Data repositories
│       ├── service/         # Business logic
│       └── controller/      # REST endpoints
└── tea-dealer-frontend/
    └── src/
        ├── pages/           # Full page components
        ├── components/      # Reusable UI components
        ├── hooks/           # Custom React hooks
        ├── services/        # API call helpers
        ├── contexts/        # React Contexts
        └── utils/           # Shared utility functions
```

---

## 4. Data Models

### Customer
| Field | Type | Notes |
|---|---|---|
| `bookNumber` | String (unique) | Customer ledger identifier |
| `growerNameEnglish` | String | Name in English |
| `growerNameSinhala` | String | Name in Sinhala |
| `address`, `nic`, `landName` | String | Customer details |
| `contactNumber`, `route` | String | Contact and delivery route |
| `transportExempt` | Boolean | If `true`, transport deduction is not charged |

### Collection
| Field | Type | Notes |
|---|---|---|
| `bookNumber` | String | FK reference to customer |
| `collectionDate` | Date | Date of collection |
| `grade` | Enum (GRADE_1, GRADE_2) | Tea grade |
| `weightKg` | BigDecimal | Weight collected — stored as whole number |
| `ratePerKg` | BigDecimal | Grade rate at time of entry |
| Unique constraint | — | (bookNumber, collectionDate, grade) |

### MonthlyRate
| Field | Type | Notes |
|---|---|---|
| `year`, `month` | Integer | Identifies the rate period (unique) |
| `grade1Rate`, `grade2Rate` | BigDecimal | Price per kg per grade |
| `supplyDeductionPercentage` | BigDecimal | % of total kg deducted before amount is calculated |
| `transportRatePerKg` | BigDecimal | Transport cost per payable kg |
| `teaPacketPrice` | BigDecimal | Price per tea packet unit |
| `stampFee` | BigDecimal | Fixed stamp fee amount |

### Invoice
| Field | Type | Notes |
|---|---|---|
| `year`, `month` | Integer | Invoice period |
| `bookNumber`, `customerName`, `customerNameSinhala` | String | Snapshot at generation time |
| `grade1Kg`, `grade2Kg`, `totalKg` | BigDecimal | Raw collection totals (always whole numbers) |
| `supplyDeductionPercentage` | BigDecimal | % used for deduction |
| `supplyDeductionKg` | BigDecimal | Calculated deduction in kg (rounded per config) |
| `payableKg` | BigDecimal | `totalKg - supplyDeductionKg` |
| `grade1Rate`, `grade2Rate` | BigDecimal | Rates used at generation |
| `grade1Amount`, `grade2Amount`, `totalAmount` | BigDecimal | Gross payment amounts (2 decimal places) |
| `lastMonthArrears`, `advanceAmount`, `loanAmount` | BigDecimal | Deduction items |
| `fertilizer1Amount`, `fertilizer2Amount` | BigDecimal | Deduction items |
| `teaPacketsCount`, `teaPacketsTotal` | Integer / BigDecimal | Tea packets deduction |
| `agrochemicalsAmount`, `otherDeductions` | BigDecimal | Deduction items |
| `transportDeduction` | BigDecimal | Per-kg transport charge |
| `stampFee` | BigDecimal | Applied conditionally |
| `totalDeductions` | BigDecimal | Auto-calculated sum of all deductions |
| `netAmount` | BigDecimal | `totalAmount - totalDeductions` |
| `collectionDetails` | TEXT (JSON) | Snapshot of daily collections |
| `status` | Enum (GENERATED, PAID, CANCELLED) | |
| `transportExempt` | Boolean | Snapshot from customer at generation time |

> `totalKg`, `totalDeductions`, and `netAmount` are recalculated automatically on every persist/update by `Invoice.calculateTotals()`.

### Deduction
Tracks monthly deductions per customer, populated before invoice generation.

| Field | Notes |
|---|---|
| `lastMonthArrears` | Manual arrears entry |
| `advanceAmount`, `advanceDate` | Advance given |
| `loanAmount` | Loan outstanding |
| `fertilizer1Amount`, `fertilizer2Amount` | Fertilizer supplied |
| `teaPacketsCount`, `teaPacketsTotal` | Tea packets supplied |
| `agrochemicalsAmount` | Agrochemicals supplied |
| `otherDeductions`, `otherDeductionsNote` | Catch-all deduction |

### AppSettings
Key-value store for all configurable settings.

| Field | Notes |
|---|---|
| `settingKey` | Unique identifier string |
| `settingValue` | String or JSON value (LONGTEXT) |

---

## 5. Core Business Flow

```
Daily:
  Enter tea collection kg per customer per grade
  ↓
Monthly:
  Set monthly rates (grade rates, transport, stamp fee, deduction %)
  Enter manual deductions per customer (advance, loan, fertilizer, etc.)
  ↓
  Generate invoices (all at once or individually)
  ↓
  Print/download invoices on pre-printed forms
```

---

## 6. Collection Recording

### Entry rules
- Weight must be a **whole number** (kg). The UI blocks decimal input (`.` and `,` keys suppressed, paste-through stripped via `Math.floor`).
- Two grades per customer per day: GRADE_1 and GRADE_2 (each recorded separately).
- A unique constraint on `(bookNumber, collectionDate, grade)` prevents duplicates; saving the same entry again updates it.

### Saving
`useCollections.jsx` → `POST /collections/save`

```
weightKg: parseFloat(weight)   // user input is already a whole number string
```

The backend stores with `scale=2` (e.g., `100.00`), but the effective value is always a whole number because the frontend enforces this.

### Display
- Daily totals: `Math.round(total)` — always shown as integer.
- CollectionTable last column: `Math.round(grade1Weight + grade2Weight)`.

---

## 7. Invoice Generation — Full Calculation Walkthrough

**Source:** `InvoiceService.java → generateInvoice(customerId, year, month)`

---

### Step 1 — Aggregate collections

```
grade1Kg = SUM(weightKg) for GRADE_1 in month
grade2Kg = SUM(weightKg) for GRADE_2 in month
totalKg  = grade1Kg + grade2Kg
```

`grade1Kg`, `grade2Kg`, `totalKg` are always whole-number values because each collection is entered as a whole number.

---

### Step 2 — Supply deduction (kg)

```
supplyDeductionPercentage = MonthlyRate.supplyDeductionPercentage  (default: 4.00%)

rawSupplyDeductionKg = totalKg × (supplyDeductionPercentage / 100)
                     [intermediate scale: 4 decimal places, HALF_UP]

supplyDeductionKg = applyDeductionRounding(rawSupplyDeductionKg)
                  [see Rounding Modes section]

payableKg = totalKg - supplyDeductionKg
```

---

### Step 3 — Proportional grade split

The deduction is distributed across grades proportionally, not calculated independently per grade:

```
reductionMultiplier = payableKg / totalKg   [6 decimal places, HALF_UP]

payableGrade1Kg = grade1Kg × reductionMultiplier  [2 decimal places, HALF_UP]
payableGrade2Kg = grade2Kg × reductionMultiplier  [2 decimal places, HALF_UP]
```

> **Note:** `payableGrade1Kg` and `payableGrade2Kg` are intermediate values used only to calculate amounts. They are not stored in the Invoice model.
>
> For invoice display, per-grade deduction and net kg are derived frontend-side proportionally from the stored `supplyDeductionKg` (see [Number Formatting Rules](#10-number-formatting-rules)).

---

### Step 4 — Grade amounts

```
grade1Amount = payableGrade1Kg × grade1Rate   [2 decimal places, HALF_UP]
grade2Amount = payableGrade2Kg × grade2Rate   [2 decimal places, HALF_UP]
totalAmount  = grade1Amount + grade2Amount
```

---

### Step 5 — Transport deduction

```
If customer.transportExempt == true:
    transportDeduction = 0
Else:
    transportDeduction = payableKg × transportRatePerKg   [2 decimal places, HALF_UP]
```

---

### Step 6 — Manual deductions

Fetched from the `Deduction` record for the customer/period:

```
advanceAmount, loanAmount
fertilizer1Amount, fertilizer2Amount
teaPacketsTotal, agrochemicalsAmount
otherDeductions
lastMonthArrears (manual entry)
```

---

### Step 7 — Automatic arrears

If `auto_arrears_carry_forward` setting is `true`:

```
prevMonth invoice → prevInvoice.netAmount
If prevInvoice.netAmount < 0:
    autoArrears = abs(prevInvoice.netAmount)
Else:
    autoArrears = 0

totalArrears = manualArrears + autoArrears
```

---

### Step 8 — Stamp fee (conditional)

See [Stamp Fee Modes](#9-stamp-fee-modes) for details.

```
stampFee = (applyStampFee ? MonthlyRate.stampFee : 0)
```

---

### Step 9 — Final totals (auto-calculated on save)

Calculated in `Invoice.calculateTotals()` called by `@PrePersist` / `@PreUpdate`:

```
totalDeductions = lastMonthArrears
               + advanceAmount
               + loanAmount
               + fertilizer1Amount
               + fertilizer2Amount
               + teaPacketsTotal
               + agrochemicalsAmount
               + transportDeduction
               + stampFee
               + otherDeductions

netAmount = totalAmount - totalDeductions
```

---

## 8. Rounding Modes

Controls how `supplyDeductionKg` is rounded after the raw calculation.

**Setting key:** `deduction_rounding_mode`
**Default:** `half_up`

| Mode | Key | Backend (`RoundingMode`) | Frontend (`formatCalculatedKg`) | Example: raw = 5.5 |
|---|---|---|---|---|
| Half Up | `half_up` | `setScale(0, HALF_UP)` | `Math.round()` | → 6 |
| Include Decimals | `include_decimals` | `setScale(2, HALF_UP)` | `toLocaleString` (2 dp) | → 5.50 |
| Ceiling | `ceiling` | `setScale(0, CEILING)` | `Math.ceil()` | → 6 |
| Floor | `floor` | `setScale(0, FLOOR)` | `Math.floor()` | → 5 |

**Backend implementation:** `InvoiceService.applyDeductionRounding()`
**Frontend implementation:** `PrintableInvoice.formatCalculatedKg()`

The rounding mode is applied **only** to the supply deduction kg calculation and its derived display values (`supplyDeductionKg`, `payableKg`, `grade1DeductionKg`, `grade2DeductionKg`, `grade1NetKg`, `grade2NetKg`).

---

## 9. Stamp Fee Modes

Controls when the stamp fee is included in the invoice.

**Setting key:** `stamp_fee_mode`
**Default:** `include_all`

| Mode | Key | Condition |
|---|---|---|
| Include All | `include_all` | Always charge stamp fee |
| Exclude No Supply | `exclude_no_supply` | Skip if `totalKg == 0` |
| Exclude Net Pay Above | `exclude_net_pay_above` | Skip if `preliminaryNetPay > netPayThreshold` (threshold from `stamp_fee_net_pay_threshold`) |
| Exclude Supply More Than | `exclude_supply_more_than` | Skip if `totalKg > supplyKgThreshold` (threshold from `stamp_fee_supply_kg_threshold`) |

For `exclude_net_pay_above`, the preliminary net pay is calculated **without** stamp fee but **with** all other deductions.

---

## 10. Number Formatting Rules

These rules apply consistently across the frontend.

| Value type | Rule | Function used |
|---|---|---|
| **Raw collection kg** (grade1Kg, grade2Kg, totalKg, daily day fields) | Always whole number | `formatKg()` → `Math.round().toString()` |
| **Calculated kg** (supplyDeductionKg, payableKg, grade1DeductionKg, grade2DeductionKg, grade1NetKg, grade2NetKg) | Follows configured rounding mode | `formatCalculatedKg()` (see Rounding Modes) |
| **Price / monetary values** (rates, amounts, deductions, netAmount) | Always 2 decimal places | `formatNumber()` → `toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})` |

### Per-grade deduction display

`grade1DeductionKg` and `grade2DeductionKg` are not stored in the backend. They are calculated proportionally in the frontend from the stored `supplyDeductionKg`:

```js
// PrintableInvoice.jsx
grade1DeductionKg = supplyDeductionKg × (grade1Kg / totalKg)
grade2DeductionKg = supplyDeductionKg × (grade2Kg / totalKg)

grade1NetKg = grade1Kg - grade1DeductionKg
grade2NetKg = grade2Kg - grade2DeductionKg
```

This ensures per-grade values always sum exactly to the total stored `supplyDeductionKg`.

---

## 11. Invoice Template System

### How it works

The invoice is printed on a **pre-printed physical form**. The template system positions text values over a scanned image of that form.

- A background image of the pre-printed form is uploaded as base64.
- Fields are dragged and dropped to match the printed form's text areas.
- At print time, only the text values are printed (background image opacity = 0 when printing).

### Field positioning

Each field stores: `{ id, x (%), y (%), align, fontSize, fontWeight, baseId }`

- `x` and `y` are percentages of the canvas size.
- `align`: `left`, `center`, or `right` (applied via CSS `translateX`).
- `baseId`: used for multi-drop fields (e.g., `month_2` has `baseId: 'month'`).

### Available template fields

| Category | Fields |
|---|---|
| Customer | `bookNumber`, `customerName`, `customerNameSinhala` |
| Period | `month`, `year` (multi-drop supported) |
| Collection (raw) | `grade1Kg`, `grade2Kg`, `totalKg` |
| Daily breakdown | `day01` … `day31` |
| Supply deduction | `supplyDeductionKg`, `supplyDeductionPercent` |
| Per-grade deduction | `grade1DeductionKg`, `grade2DeductionKg` |
| Net kg per grade | `grade1NetKg`, `grade2NetKg`, `payableKg` |
| Rates | `grade1Rate`, `grade2Rate` |
| Amounts | `grade1Amount`, `grade2Amount`, `totalAmount` |
| Deductions | `advance`, `loan`, `fertilizer1`, `fertilizer2`, `teaPackets`, `transport`, `stampFee`, `otherDeductions`, `arrears`, `agrochemicals` |
| Totals | `totalDeductions`, `netAmount` |
| Notes | `specialNote1`, `specialNote2` |

### Storage

Template config is stored as JSON in `AppSettings` under key `invoice_template_config`:

```json
{
  "templateImage": "data:image/png;base64,...",
  "fields": [
    { "id": "bookNumber", "x": 12.5, "y": 8.0, "align": "left", "fontSize": 11 }
  ],
  "templateSize": { "width": 800, "height": 1000 },
  "globalFontFamily": "'Courier New', Courier, monospace"
}
```

---

## 12. Configurations Reference

| Setting | Key | Type | Notes |
|---|---|---|---|
| Deduction rounding mode | `deduction_rounding_mode` | String | `half_up` / `include_decimals` / `ceiling` / `floor` |
| Stamp fee mode | `stamp_fee_mode` | String | See Stamp Fee Modes |
| Stamp fee net pay threshold | `stamp_fee_net_pay_threshold` | Decimal string | Used with `exclude_net_pay_above` |
| Stamp fee supply kg threshold | `stamp_fee_supply_kg_threshold` | Decimal string | Used with `exclude_supply_more_than` |
| Auto arrears carry forward | `auto_arrears_carry_forward` | `"true"` / `"false"` | |
| Invoice template config | `invoice_template_config` | JSON string | Full template |
| Invoice PDF include graphics | `invoice_pdf_include_graphics` | `"true"` / `"false"` | |
| Invoice PDF page size | `invoice_pdf_page_size` | String | `A5` / `A4` / `A6` / `LETTER` |
| Dealer name | `dealer_name` | String | |
| Registration number | `registration_number` | String | |
| Dealer address | `dealer_address` | String | |
| Language | `language` | `en` / `si` | |
| Login background | `login_background` | base64 string | |
| Page: Stock enabled | `page_stock_enabled` | `"true"` / `"false"` | |
| Page: Deductions enabled | `page_deductions_enabled` | `"true"` / `"false"` | |
| Page: Invoices enabled | `page_invoices_enabled` | `"true"` / `"false"` | |
| Page: Reports enabled | `page_reports_enabled` | `"true"` / `"false"` | |
| Tab: Fertilizer enabled | `stock_tab_fertilizer_enabled` | `"true"` / `"false"` | |
| Tab: Tea packets enabled | `stock_tab_tea_packets_enabled` | `"true"` / `"false"` | |
| Special note 1 enabled | `special_note_1_enabled` | `"true"` / `"false"` | |
| Special note 1 text | `special_note_1_text` | String | |
| Special note 2 enabled | `special_note_2_enabled` | `"true"` / `"false"` | |
| Special note 2 text | `special_note_2_text` | String | |

---

## 13. Pages Reference

| Page | File | Purpose |
|---|---|---|
| Login | `LoginPage.jsx` | Authentication, configurable background |
| Dashboard | `DashboardPage.jsx` | Today's stats, totals, pending customers |
| Collection Recording | `CollectionRecordingPage.jsx` | Daily kg entry for all customers |
| Customer Management | `CustomerManagementPage.jsx` | Add/edit/delete customers, CSV import |
| Manage Rates | `ManageRatesPage.jsx` | Monthly rates (grades, transport, stamp fee, deduction %) |
| Deductions | `DeductionsPage.jsx` | Monthly deductions per customer |
| Invoices | `InvoicesPage.jsx` | Generate, view, print, download, delete invoices |
| Stock Management | `StockManagementPage.jsx` | Fertilizer and tea packet inventory |
| Configurations | `ConfigurationsPage.jsx` | All app settings and invoice template editor |

---

## 14. Settings Keys Reference

All constants are in `tea-dealer-frontend/src/services/settingsService.js` under `SETTING_KEYS`.

```js
SETTING_KEYS = {
  DEALER_NAME, REGISTRATION_NUMBER, DEALER_ADDRESS,
  AUTO_ARREARS_CARRY_FORWARD,
  STAMP_FEE_MODE, STAMP_FEE_NET_PAY_THRESHOLD, STAMP_FEE_SUPPLY_KG_THRESHOLD,
  INVOICE_PDF_INCLUDE_GRAPHICS, INVOICE_PDF_PAGE_SIZE,
  INVOICE_TEMPLATE_CONFIG, INVOICE_TEMPLATE_FONT_FAMILY,
  PAGE_STOCK_ENABLED, PAGE_DEDUCTIONS_ENABLED, PAGE_INVOICES_ENABLED, PAGE_REPORTS_ENABLED,
  STOCK_TAB_FERTILIZER_ENABLED, STOCK_TAB_TEA_PACKETS_ENABLED,
  DEDUCTION_ROUNDING_MODE,
  LANGUAGE,
  SPECIAL_NOTE_1_ENABLED, SPECIAL_NOTE_1_TEXT,
  SPECIAL_NOTE_2_ENABLED, SPECIAL_NOTE_2_TEXT,
  LOGIN_BACKGROUND,
}
```

---

## 15. Changelog

| Date | Change | Files affected |
|---|---|---|
| 2026-03-03 | Fixed `formatKg` in `PrintableInvoice` to use separate `formatCalculatedKg` that respects configured rounding mode (ceiling/floor/include_decimals). Fixed `grade1DeductionKg`/`grade2DeductionKg` to derive proportionally from stored `supplyDeductionKg` instead of calculating independently. | `PrintableInvoice.jsx` |
| 2026-03-03 | Added special notes section. Fixed PDF download for other devices. Added new fields to bill configuration. | `PrintableInvoice.jsx`, PDF service |
| 2026-03-03 | Invoice improvements: multi-drop fields, network PDF download, kg formatting. | `InvoicesPage.jsx`, `PrintableInvoice.jsx` |
