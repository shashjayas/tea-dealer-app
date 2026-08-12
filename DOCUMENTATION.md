# Tea Dealer App — Developer Documentation

> **Rule:** Update the [Changelog](#changelog) every time logic, calculations, or configurations change.

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Data Models](#4-data-models)
5. [Invoice Calculation Flow](#5-invoice-calculation-flow)
6. [Number Formatting Rules](#6-number-formatting-rules)
7. [Deduction Rounding Modes](#7-deduction-rounding-modes)
8. [Stamp Fee Modes](#8-stamp-fee-modes)
9. [Auto Arrears Carry-Forward](#9-auto-arrears-carry-forward)
10. [Invoice Template System](#10-invoice-template-system)
11. [PDF Export](#11-pdf-export)
12. [Collection Entry Flow](#12-collection-entry-flow)
13. [Configuration Settings Reference](#13-configuration-settings-reference)
14. [Pages Reference](#14-pages-reference)
15. [Changelog](#changelog)

---

## 1. App Overview

The Tea Dealer App is a full-stack business management system for Sri Lankan tea leaf dealers. It manages:

- **Customers** (growers) with book numbers and routes
- **Daily collections** (tea leaf weight per customer per grade)
- **Monthly invoices** auto-generated from collections + deductions + rates
- **Deductions** (advances, loans, fertilizer, transport, stamp fee, etc.)
- **Printable invoices** mapped onto a configurable pre-printed form template
- **PDF export** for offline use

The system supports two tea grades (GRADE_1, GRADE_2), per-grade rates, and a configurable supply deduction percentage applied independently to each grade.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 11, Spring Boot, JPA/Hibernate |
| Database | MySQL (via JPA entities with `@Column` mappings) |
| Frontend | React 18, Tailwind CSS |
| i18n | react-i18next (English + Sinhala) |
| PDF | Backend: iText (InvoicePdfService.java) |
| Print | Browser print via `window.open` (PrintableInvoice.jsx) |
| Auth | Spring Security (basic auth / session) |

---

## 3. Project Structure

```
Tea Dealer App/
├── tea-dealer-backend/
│   └── src/main/java/com/teadealer/
│       ├── model/               # JPA entities
│       │   ├── Customer.java
│       │   ├── Collection.java
│       │   ├── Deduction.java
│       │   ├── Invoice.java
│       │   ├── MonthlyRate.java
│       │   ├── AppSettings.java
│       │   └── TeaGrade.java    (enum: GRADE_1, GRADE_2)
│       ├── service/             # Business logic
│       │   ├── InvoiceService.java       ← main calculation logic
│       │   ├── InvoicePdfService.java    ← PDF field preparation
│       │   ├── CustomerService.java
│       │   ├── CollectionService.java
│       │   ├── DeductionService.java
│       │   ├── MonthlyRateService.java
│       │   └── AppSettingsService.java
│       ├── controller/          # REST endpoints
│       └── repository/          # Spring Data JPA repos
│
└── tea-dealer-frontend/
    └── src/
        ├── pages/               # Full-page views
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── CustomerManagementPage.jsx
        │   ├── CollectionRecordingPage.jsx
        │   ├── ManageRatesPage.jsx
        │   ├── DeductionsPage.jsx
        │   ├── StockManagementPage.jsx
        │   ├── InvoicesPage.jsx
        │   └── ConfigurationsPage.jsx
        ├── components/
        │   ├── invoices/
        │   │   └── PrintableInvoice.jsx  ← print preview + browser print
        │   └── collections/
        │       └── CollectionTable.jsx   ← daily entry table
        ├── hooks/
        │   └── useCollections.jsx        ← collection save/fetch logic
        └── services/
            ├── api.js                    ← base API call helper
            └── settingsService.js        ← all settings helpers + SETTING_KEYS
```

---

## 4. Data Models

### Customer

| Field | DB Type | Description |
|-------|---------|-------------|
| id | BIGINT PK | Auto-generated |
| bookNumber | VARCHAR, unique | Customer identifier used across all records |
| growerNameEnglish | VARCHAR | Customer name (English) |
| growerNameSinhala | VARCHAR | Customer name (Sinhala) |
| address | TEXT | Physical address |
| nic | VARCHAR | National ID |
| landName | VARCHAR | Tea estate/land name |
| contactNumber | VARCHAR | Phone |
| route | VARCHAR | Delivery route/zone |
| transportExempt | BOOLEAN | If `true`, transport fee not charged (default: `false`) |
| createdAt | DATETIME | Auto-set on create |
| updatedAt | DATETIME | Auto-updated on save |

---

### Collection

One record per customer × date × grade.

| Field | DB Type | Description |
|-------|---------|-------------|
| id | BIGINT PK | Auto-generated |
| bookNumber | VARCHAR | Denormalized from customer |
| customer | FK → Customer | Required |
| collectionDate | DATE | Date of collection. Unique with bookNumber + grade |
| grade | ENUM (GRADE_1, GRADE_2) | Tea grade. Default: GRADE_2 |
| weightKg | INT | Weight in whole kg (never decimals) |
| ratePerKg | DECIMAL(10,2) | Rate at time of collection |
| totalAmount | DECIMAL(10,2) | Auto-calculated: weightKg × ratePerKg |
| notes | TEXT | Optional note |
| createdAt / updatedAt | DATETIME | Timestamps |

---

### MonthlyRate

One record per year+month. Sets the rates used during invoice generation.

| Field | DB Type | Description |
|-------|---------|-------------|
| id | BIGINT PK | Auto-generated |
| year | INTEGER | Required. Unique with month |
| month | INTEGER (1–12) | Required |
| grade1Rate | DECIMAL(10,2) | Price per kg for Grade 1 tea |
| grade2Rate | DECIMAL(10,2) | Price per kg for Grade 2 tea |
| supplyDeductionPercentage | DECIMAL(5,2) | % deducted from each grade's kg (default 4.00) |
| transportRatePerKg | DECIMAL(10,2) | Transport cost per payable kg |
| stampFee | DECIMAL(10,2) | Government stamp fee amount |
| teaPacketPrice | DECIMAL(10,2) | Price per tea packet |
| createdAt / updatedAt | DATETIME | Timestamps |

---

### Deduction

One record per customer × year × month. Stores manual deductions entered before invoice generation.

| Field | DB Type | Description |
|-------|---------|-------------|
| id | BIGINT PK | Auto-generated |
| customer | FK → Customer | Required |
| bookNumber | VARCHAR | Denormalized |
| year / month | INTEGER | Billing period. Unique with customer |
| lastMonthArrears | DECIMAL(10,2) | Manual arrears from previous month |
| advanceAmount | DECIMAL(10,2) | Advance payment to customer |
| advanceEntries | TEXT (JSON) | Array of advance entries: `[{date, amount}, ...]` |
| loanAmount | DECIMAL(10,2) | Loan given |
| fertilizer1Amount | DECIMAL(10,2) | Fertilizer type 1 cost |
| fertilizer2Amount | DECIMAL(10,2) | Fertilizer type 2 cost |
| teaPacketsCount | INTEGER | Number of tea packets supplied |
| teaPacketsTotal | DECIMAL(10,2) | Total cost of tea packets |
| agrochemicalsAmount | DECIMAL(10,2) | Agrochemical cost |
| otherDeductions | DECIMAL(10,2) | Miscellaneous deductions |
| otherDeductionsNote | TEXT | Note for other deductions |

---

### Invoice

One record per customer × year × month. Snapshot of all calculation results.

#### Kg Fields (stored as INT)

| Field | Description |
|-------|-------------|
| grade1Kg | Total Grade 1 kg collected (rounded to integer) |
| grade2Kg | Total Grade 2 kg collected (rounded to integer) |
| totalKg | grade1Kg + grade2Kg (auto-calculated by `calculateTotals()`) |
| grade1DeductionKg | Supply deduction for Grade 1: `grade1Kg × pct / 100` rounded per mode |
| grade2DeductionKg | Supply deduction for Grade 2: `grade2Kg × pct / 100` rounded per mode |
| supplyDeductionKg | grade1DeductionKg + grade2DeductionKg |
| payableKg | totalKg − supplyDeductionKg |

#### Rate & Amount Fields (DECIMAL 10,2)

| Field | Description |
|-------|-------------|
| grade1Rate / grade2Rate | Rates from MonthlyRate at time of generation |
| grade1Amount | grade1NetKg × grade1Rate |
| grade2Amount | grade2NetKg × grade2Rate |
| totalAmount | grade1Amount + grade2Amount |

#### Deduction Snapshot Fields (DECIMAL 10,2)

All deduction fields are **copied from the Deduction record** at generation time:
`lastMonthArrears`, `advanceAmount`, `loanAmount`, `fertilizer1Amount`, `fertilizer2Amount`,
`teaPacketsTotal`, `agrochemicalsAmount`, `otherDeductions`, `transportDeduction`, `stampFee`

#### Final Totals (auto-calculated by `calculateTotals()`)

| Field | Formula |
|-------|---------|
| totalDeductions | Sum of all 10 deduction fields |
| netAmount | totalAmount − totalDeductions |

#### Other Fields

| Field | Description |
|-------|-------------|
| supplyDeductionPercentage | Snapshot of % used |
| transportRatePerKg | Snapshot of transport rate |
| transportExempt | Boolean — whether transport was applied |
| collectionDetails | JSON array of daily collections: `[{date, grade, weightKg}, ...]` |
| status | GENERATED / PAID / CANCELLED |
| generatedAt / updatedAt | Timestamps |

---

### AppSettings

Simple key-value store. All config in the app passes through this table.

| Field | DB Type | Description |
|-------|---------|-------------|
| id | BIGINT PK | Auto-generated |
| settingKey | VARCHAR, unique | Identifier — see [Settings Reference](#13-configuration-settings-reference) |
| settingValue | LONGTEXT | String value (may contain JSON, base64, or plain text) |
| updatedAt | DATETIME | Auto-updated on save |

---

## 5. Invoice Calculation Flow

**Entry point:** `InvoiceService.generateInvoice(customerId, year, month)`

This is an upsert — it creates a new invoice or regenerates an existing one.

### Step 1 — Aggregate Collections

```
grade1Kg = SUM(weightKg) for GRADE_1 collections in [year-month]
grade2Kg = SUM(weightKg) for GRADE_2 collections in [year-month]
```

Both values are rounded to integers (HALF_UP) since collection entries are always whole numbers.

```
totalKg = grade1Kg + grade2Kg
```

The raw daily collections are serialized as JSON into `invoice.collectionDetails` for later display on the print preview.

---

### Step 2 — Supply Deduction (per grade, independent)

```
deduction % = monthlyRate.supplyDeductionPercentage  (default 4.00%)

grade1DeductionKg = applyDeductionRounding(grade1Kg × pct / 100)
grade2DeductionKg = applyDeductionRounding(grade2Kg × pct / 100)
```

`applyDeductionRounding()` applies the configured [Deduction Rounding Mode](#7-deduction-rounding-modes).

Intermediate precision uses 4 decimal places before rounding to avoid floating-point drift.

```
grade1NetKg = grade1Kg − grade1DeductionKg
grade2NetKg = grade2Kg − grade2DeductionKg

supplyDeductionKg = grade1DeductionKg + grade2DeductionKg
payableKg         = totalKg − supplyDeductionKg
```

> **Design note:** Each grade is deducted independently — not as a proportion of the total. Because `gradeKg` is always an integer, `gradeNetKg` is always exact with no rounding error.

---

### Step 3 — Amounts

```
grade1Amount = grade1NetKg × grade1Rate  (rounded to 2dp HALF_UP)
grade2Amount = grade2NetKg × grade2Rate  (rounded to 2dp HALF_UP)
totalAmount  = grade1Amount + grade2Amount
```

---

### Step 4 — Transport Deduction

```
if customer.transportExempt:
    transportDeduction = 0
else:
    transportDeduction = payableKg × monthlyRate.transportRatePerKg  (2dp HALF_UP)
```

---

### Step 5 — Deduction Snapshot

All values are copied from the `Deduction` record for this customer/period:

| Invoice field | Source |
|--------------|--------|
| advanceAmount | deduction.advanceAmount |
| loanAmount | deduction.loanAmount |
| fertilizer1Amount | deduction.fertilizer1Amount |
| fertilizer2Amount | deduction.fertilizer2Amount |
| teaPacketsTotal | deduction.teaPacketsTotal |
| agrochemicalsAmount | deduction.agrochemicalsAmount |
| otherDeductions | deduction.otherDeductions |

---

### Step 6 — Auto Arrears

If the `auto_arrears_carry_forward` setting is `"true"`, the previous month's invoice is checked:

```
if previousMonth.netAmount < 0:
    autoArrears = abs(previousMonth.netAmount)
```

```
invoice.lastMonthArrears = manualArrears + autoArrears
```

Where `manualArrears` is from the Deduction record.

---

### Step 7 — Stamp Fee

The stamp fee amount comes from `monthlyRate.stampFee`. Whether it is applied depends on the [Stamp Fee Mode](#8-stamp-fee-modes).

---

### Step 8 — Final Totals (auto via `@PrePersist/@PreUpdate`)

`Invoice.calculateTotals()` runs automatically on every save:

```
totalDeductions = lastMonthArrears + advanceAmount + loanAmount
               + fertilizer1Amount + fertilizer2Amount + teaPacketsTotal
               + agrochemicalsAmount + transportDeduction + stampFee
               + otherDeductions

netAmount = totalAmount − totalDeductions
```

---

## 6. Number Formatting Rules

These rules apply consistently in both frontend (`PrintableInvoice.jsx`) and backend (`InvoicePdfService.java`).

| Value Type | Rule | Function (frontend) | Example |
|-----------|------|---------------------|---------|
| Raw collection kg | Always integer, no decimals | `formatKg()` → `Math.round()` | `226` |
| Calculated kg (deductions, payable, net) | Respects configured rounding mode | `formatCalculatedKg()` | `9` or `9.00` |
| Monetary / price values | Always 2 decimal places | `formatNumber()` → `toLocaleString('en-US', {min/maxFraction: 2})` | `18,060.00` |
| Rates | Always 2 decimal places | `formatNumber()` | `120.00` |
| Supply deduction % | 1 decimal place | inline `parseFloat(...).toFixed(1)` | `4.0` |

**Raw collection kg** fields: `grade1Kg`, `grade2Kg`, `totalKg`, `day01`–`day31`

**Calculated kg** fields: `grade1DeductionKg`, `grade2DeductionKg`, `supplyDeductionKg`, `payableKg`, `grade1NetKg`, `grade2NetKg`

---

## 7. Deduction Rounding Modes

Setting key: `deduction_rounding_mode`

Controls how `grade1DeductionKg` and `grade2DeductionKg` are rounded from the raw division result.

| Mode value | Behavior | Example (13 × 4% = 0.52) | Backend constant |
|-----------|----------|--------------------------|-----------------|
| `half_up` *(default)* | Round to nearest integer, 0.5 rounds up | → `1` | `RoundingMode.HALF_UP` |
| `include_decimals` | Keep 2 decimal places | → `0.52` | `setScale(2, HALF_UP)` |
| `ceiling` | Always round up to next integer | → `1` | `RoundingMode.CEILING` |
| `floor` | Always round down (truncate) | → `0` | `RoundingMode.FLOOR` |

**Backend:** `InvoiceService.applyDeductionRounding(BigDecimal)` — called at Step 2.

**Frontend:** `PrintableInvoice.formatCalculatedKg(value)` — mirrors the same logic for display. Reads `roundingMode` state loaded from DB on mount.

---

## 8. Stamp Fee Modes

Setting key: `stamp_fee_mode`

| Mode value | Description | Required extra setting |
|-----------|-------------|----------------------|
| `include_all` *(default)* | Always add stamp fee to every invoice | — |
| `exclude_no_supply` | Skip stamp fee when customer has zero totalKg | — |
| `exclude_net_pay_above` | Skip stamp fee when preliminary net pay > threshold | `stamp_fee_net_pay_threshold` |
| `exclude_supply_more_than` | Skip stamp fee when totalKg > threshold | `stamp_fee_supply_kg_threshold` |

For `exclude_net_pay_above`, "preliminary net pay" is calculated without the stamp fee itself — all other deductions are included.

---

## 9. Auto Arrears Carry-Forward

Setting key: `auto_arrears_carry_forward` (`"true"` / `"false"`)

When enabled, if a customer's previous month `netAmount` is negative (they owe money), the absolute value is automatically added to `lastMonthArrears` on the next invoice.

```
totalArrears = manualArrears (from Deduction record) + autoArrears
```

Both contribute to `totalDeductions` and reduce `netAmount`.

---

## 10. Invoice Template System

Invoices are printed on **pre-printed physical forms**. The app overlays field values at exact pixel positions.

### How It Works

1. Upload a photo/scan of the pre-printed form as a background image.
2. Drag field labels onto the template at exact positions.
3. At print time, the background is hidden and only the values are printed — aligning with the pre-printed form.

### Field Configuration

Each field in `invoice_template_fields` (JSON array) has:

```json
{
  "id": "grade1Kg",
  "baseId": "grade1Kg",
  "x": 45.2,
  "y": 31.8,
  "fontSize": 12,
  "fontWeight": "normal",
  "align": "right"
}
```

- `x` / `y` — Position as % of template container size
- `align` — `left` / `center` / `right`. CSS `translateX` is applied: right=`-100%`, center=`-50%`, left=`none`
- `baseId` — Used for multi-drop fields (e.g., `month_2` has `baseId: "month"`). Frontend resolves data using `baseId`.

### Multi-Drop Fields

`month` and `year` fields support `allowMultiple: true`. When added a second time, the id becomes `month_2`, `month_3`, etc., but `baseId` stays `"month"`. All instances display the same invoice month.

### Template Settings in AppSettings

| Key | Description |
|-----|-------------|
| `invoice_template_image` | Base64 PNG/JPG of the pre-printed form background |
| `invoice_template_fields` | JSON array of field objects |
| `invoice_template_size` | JSON `{width, height}` in pixels |
| `invoice_template_font_size` | Default font size (integer) |
| `invoice_template_font_family` | Font family string (default: `'Courier New', Courier, monospace`) |

### Available Template Fields

All 71 available field IDs:

**Basic:** `bookNumber`, `customerName`, `customerNameSinhala`

**Date:** `month` *(multi-drop)*, `year` *(multi-drop)*

**Daily:** `day01` – `day31` (total kg collected on that day of the month; `-` if none)

**Kg:** `grade1Kg`, `grade2Kg`, `totalKg`, `supplyDeductionKg`, `supplyDeductionPercent`, `grade1DeductionKg`, `grade2DeductionKg`, `grade1NetKg`, `grade2NetKg`, `payableKg`

**Rates/Amounts:** `grade1Rate`, `grade2Rate`, `grade1Amount`, `grade2Amount`, `totalAmount`, `totalDeductions`, `netAmount`

**Deductions:** `advance`, `loan`, `fertilizer1`, `fertilizer2`, `teaPackets`, `transport`, `stampFee`, `otherDeductions`, `arrears`, `agrochemicals`

**Notes:** `specialNote1`, `specialNote2`

---

## 11. PDF Export

**Service:** `InvoicePdfService.java`

The PDF uses the same template system but rendered server-side via iText.

- Reads `grade1DeductionKg` / `grade2DeductionKg` directly from the stored invoice fields.
- `formatKg()` → rounds to nearest integer (HALF_UP).
- `formatAmount()` → 2 decimal places with thousand separators.
- Daily fields: aggregated from `invoice.collectionDetails` JSON.
- Special notes: read from AppSettings at render time.

PDF settings:

| Setting | Key |
|---------|-----|
| Include template background image | `invoice_include_graphics` |
| Page size | `invoice_page_size` (A4, A5, A6, LETTER — default A5) |

---

## 12. Collection Entry Flow

### Daily Entry (CollectionTable.jsx + useCollections.jsx)

1. User selects a date in `CollectionRecordingPage`.
2. `useCollections.fetchCollections(date)` loads existing entries.
3. For each customer row, the user enters Grade 1 and Grade 2 weight in kg.
4. Decimals are **blocked**: `CollectionTable` prevents `.` and `,` keys and strips decimals from paste via `Math.floor`.
5. On input change, `useCollections.saveCollectionEntry(customerId, weight, grade, date)` is called.
6. If weight is 0 or empty, the collection record is **deleted**.
7. API payload: `{customerId, collectionDate, weightKg: parseFloat(weight), grade, ratePerKg: 0}`.

### Quick Add (QuickAddModal)

Uses `useCollections.quickAddCollection(formData)`. Decimals also blocked here.

---

## 13. Configuration Settings Reference

All keys are in `settingsService.js → SETTING_KEYS`. All values are stored as strings in `AppSettings`.

| Key | Type | Description |
|-----|------|-------------|
| `login_background` | base64 image | Background image for login screen |
| `theme_color` | string | UI theme colour |
| `dealer_name` | string | Business name |
| `registration_number` | string | Business registration number |
| `dealer_address` | string | Business address |
| `auto_arrears_carry_forward` | `"true"/"false"` | Enable auto arrears carry-forward |
| `stamp_fee_mode` | enum string | Stamp fee application mode |
| `stamp_fee_net_pay_threshold` | numeric string | Threshold for `exclude_net_pay_above` |
| `stamp_fee_supply_kg_threshold` | numeric string | Threshold for `exclude_supply_more_than` |
| `invoice_include_graphics` | `"true"/"false"` | Include template image in PDF |
| `invoice_page_size` | `A4/A5/A6/LETTER` | PDF page size |
| `invoice_template_image` | base64 image | Template background |
| `invoice_template_fields` | JSON array | Field position configuration |
| `invoice_template_size` | JSON `{width,height}` | Template dimensions |
| `invoice_template_font_size` | integer string | Global font size |
| `invoice_template_font_family` | CSS font string | Global font family |
| `page_stock_enabled` | `"true"/"false"` | Show/hide Stock page |
| `page_deductions_enabled` | `"true"/"false"` | Show/hide Deductions page |
| `page_invoices_enabled` | `"true"/"false"` | Show/hide Invoices page |
| `page_reports_enabled` | `"true"/"false"` | Show/hide Reports page |
| `stock_tab_fertilizer_enabled` | `"true"/"false"` | Show/hide Fertilizer tab |
| `stock_tab_tea_packets_enabled` | `"true"/"false"` | Show/hide Tea Packets tab |
| `deduction_rounding_mode` | enum string | Kg deduction rounding mode |
| `language` | `en/si` | UI language |
| `special_note_1_enabled` | `"true"/"false"` | Enable Special Note 1 on invoice |
| `special_note_1_text` | string | Special Note 1 text |
| `special_note_2_enabled` | `"true"/"false"` | Enable Special Note 2 on invoice |
| `special_note_2_text` | string | Special Note 2 text |

**Defaults (when key is absent):**
- `stamp_fee_mode` → `include_all`
- `deduction_rounding_mode` → `half_up`
- `auto_arrears_carry_forward` → `false`
- `invoice_page_size` → `A5`
- `invoice_template_font_family` → `'Courier New', Courier, monospace`
- All page visibility → `true`
- `language` → `en`

---

## 14. Pages Reference

| Page | Route Key | Description |
|------|-----------|-------------|
| Login | (unauthenticated) | Username/password login with optional custom background |
| Dashboard | `dashboard` | Summary stats: today's collections, monthly totals |
| Customer Management | `customers` | Add/edit/delete customers |
| Collection Recording | `collections` | Enter daily tea collection weights by customer |
| Manage Monthly Rates | `rates` | Set grade rates, supply deduction %, transport rate, stamp fee per month |
| Deductions | `deductions` | Enter per-customer deductions (advance, loan, fertilizer, etc.) |
| Stock Management | `stock` | Track fertilizer and tea packet stock (tabs configurable) |
| Invoices | `invoices` | Generate, view, and print monthly invoices |
| Configurations | `configurations` | System settings: template editor, stamp fee, rounding mode, page visibility, etc. |

---

## Changelog

| Date | Change | Files Affected |
|------|--------|---------------|
| 2026-03-10 | Rewrote supply deduction to calculate per grade independently (`grade1Kg × pct / 100`) instead of proportionally from total. Added `grade1DeductionKg` and `grade2DeductionKg` as stored INT columns. Invoice amounts now based on `gradeNetKg × gradeRate`. | `Invoice.java`, `InvoiceService.java`, `PrintableInvoice.jsx` |
| 2026-03-10 | Added `formatCalculatedKg()` in `PrintableInvoice.jsx` to respect configured deduction rounding mode. Previously all kg used `Math.round()`. Added `DEDUCTION_ROUNDING_MODES` loading from DB on mount. | `PrintableInvoice.jsx` |
| 2026-03-10 | Frontend now reads stored `grade1DeductionKg`/`grade2DeductionKg` directly from invoice object instead of deriving proportionally. | `PrintableInvoice.jsx` |
| 2026-03-10 | Created this DOCUMENTATION.md. | `DOCUMENTATION.md` |
