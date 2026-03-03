# Invoice Calculation Documentation

This document explains every calculation performed when generating a tea dealer invoice.

---

## 1. Tea Collection (Gross Kg)

Daily tea collections are recorded per grade. **All kg inputs are integers — no decimals are accepted.**

- The input fields enforce integer-only entry (step=1, decimal key blocked, Math.round enforced in both UI and backend).
- **Grade 1 Kg** = sum of all Grade 1 collection weights for the month (integer)
- **Grade 2 Kg** = sum of all Grade 2 collection weights for the month (integer)
- **Total Kg** = Grade 1 Kg + Grade 2 Kg (integer)

These are stored as `INT` columns in the database.

---

## 2. Supply Deduction

A supply deduction percentage is set per month in the Monthly Rates configuration.

```
Raw Deduction Kg = Total Kg × (Supply Deduction % / 100)
```

The raw value is then rounded according to the **Deduction Rounding Mode** (set in Configurations):

| Mode              | Behaviour                                          | Example (raw = 6.7) |
|-------------------|----------------------------------------------------|---------------------|
| `half_up`         | Round to nearest integer; .5 rounds up             | → 7                 |
| `include_decimals`| Keep 2 decimal places                              | → 6.70              |
| `ceiling`         | Always round up to next integer                    | → 7                 |
| `floor`           | Always round down (truncate decimals)              | → 6                 |

The result is saved as **Supply Deduction Kg** in the invoice.

```
Payable Kg (total) = Total Kg − Supply Deduction Kg
```

---

## 3. Per-Grade Deduction and Net Kg

The total Supply Deduction Kg is distributed to each grade proportionally:

```
Grade 1 Raw Deduction = Supply Deduction Kg × (Grade 1 Kg / Total Kg)
Grade 2 Raw Deduction = Supply Deduction Kg × (Grade 2 Kg / Total Kg)
```

Each grade's **net kg** is then rounded to the nearest integer:

```
Grade 1 Net Kg = round(Grade 1 Kg − Grade 1 Raw Deduction)
Grade 2 Net Kg = round(Grade 2 Kg − Grade 2 Raw Deduction)
```

### Display — Arithmetic Complement

The deduction displayed on-screen for each grade is derived as the **arithmetic complement**, not by independently rounding the raw deduction:

```
Grade 1 Displayed Deduction = round(Grade 1 Kg) − Grade 1 Net Kg
Grade 2 Displayed Deduction = round(Grade 2 Kg) − Grade 2 Net Kg
```

**Why?** Independently rounding both the deduction and the net kg can cause a display mismatch at x.5 boundaries. For example:

| Value              | Raw    | Independent round | Complement |
|--------------------|--------|-------------------|------------|
| Grade 1 Kg         | 151.00 | 151               | 151        |
| Grade 1 Deduction  | 6.50   | **7** ← problem   | **6**      |
| Grade 1 Net Kg     | 144.50 | 145               | 145        |
| Bill arithmetic    |        | 151 − 7 = 144 ≠ 145 | 151 − 6 = 145 ✓ |

The complement ensures the bill always reads correctly:
```
round(Grade 1 Kg) − Displayed Deduction = Grade 1 Net Kg   (always true)
```

---

## 4. Grade Amounts (Rs)

```
Grade 1 Amount = Grade 1 Net Kg × Grade 1 Rate
Grade 2 Amount = Grade 2 Net Kg × Grade 2 Rate
Total Amount   = Grade 1 Amount + Grade 2 Amount
```

- **Grade 1 Net Kg** and **Grade 2 Net Kg** are the integer values from step 3.
- **Grade 1 Rate** and **Grade 2 Rate** are set in Monthly Rates (Rs per kg).
- Results are rounded to 2 decimal places.

> The amount always tallies with the displayed payable kg because both use the same integer net kg.

---

## 5. Transport Deduction

```
Transport Deduction = Payable Kg (total) × Transport Rate per Kg
```

- Transport Rate per Kg is set in Monthly Rates.
- If the customer is marked **Transport Exempt**, transport deduction = 0.

---

## 6. Other Deductions

These are entered manually per customer per month in the Deductions screen:

| Field               | Description                              |
|---------------------|------------------------------------------|
| Last Month Arrears  | Unpaid balance carried from prior month  |
| Advance             | Cash advance issued during the month     |
| Loan                | Loan repayment instalment                |
| Fertilizer 1        | Fertilizer supply cost                   |
| Fertilizer 2        | Second fertilizer supply cost            |
| Tea Packets         | Value of tea packets issued              |
| Agrochemicals       | Agrochemical supply cost                 |
| Other Deductions    | Any other deduction (with note)          |

**Auto Arrears (optional setting):** If enabled, any negative net pay from the previous month is automatically carried forward as arrears for the current month.

---

## 7. Stamp Fee

Stamp Fee amount is set in Monthly Rates. Whether it is applied depends on the **Stamp Fee Mode** (set in Configurations):

| Mode                      | Applied when…                                         |
|---------------------------|-------------------------------------------------------|
| `include_all` (default)   | Always                                                |
| `exclude_no_supply`       | Excluded if customer supplied 0 kg                    |
| `exclude_net_pay_above`   | Excluded if net pay (before stamp fee) > threshold    |
| `exclude_supply_more_than`| Excluded if total supply kg > threshold               |

---

## 8. Total Deductions and Net Pay

```
Total Deductions = Arrears + Advance + Loan + Fertilizer 1 + Fertilizer 2
                 + Tea Packets + Agrochemicals + Transport + Stamp Fee
                 + Other Deductions

Net Pay = Total Amount − Total Deductions
```

- Net Pay can be negative (customer owes more than earned). In that case it is shown as a negative value and, if Auto Arrears is enabled, it is carried to the next month automatically.

---

## 9. Calculation Flow Summary

```
Collections → Grade 1 Kg, Grade 2 Kg
           → Total Kg = G1 + G2

Total Kg × Deduction%  → Raw Deduction Kg
                       → [apply rounding mode]
                       → Supply Deduction Kg

Supply Deduction Kg × (G1 / Total)  → G1 Raw Deduction
G1 Kg − G1 Raw Deduction → round() → G1 Net Kg
G1 Net Kg × G1 Rate                → G1 Amount

Supply Deduction Kg × (G2 / Total)  → G2 Raw Deduction
G2 Kg − G2 Raw Deduction → round() → G2 Net Kg
G2 Net Kg × G2 Rate                → G2 Amount

G1 Amount + G2 Amount              → Total Amount

Payable Kg × Transport Rate        → Transport Deduction (unless exempt)

Total Amount
  − Arrears − Advance − Loan
  − Fertilizer 1 − Fertilizer 2
  − Tea Packets − Agrochemicals
  − Transport − Stamp Fee
  − Other Deductions
  = Net Pay
```

---

## 10. Display Fields Reference

| Field                  | Value shown                                              |
|------------------------|----------------------------------------------------------|
| Grade 1 Kg             | stored as INT, displayed directly                        |
| Grade 2 Kg             | stored as INT, displayed directly                        |
| Total Kg               | stored as INT (`grade1Kg + grade2Kg`)                    |
| Supply Deduction Kg    | as stored (depends on rounding mode)                     |
| Payable Kg             | `Total Kg − Supply Deduction Kg`                         |
| Grade 1 Deduction      | `round(grade1Kg) − Grade 1 Net Kg` (complement)          |
| Grade 2 Deduction      | `round(grade2Kg) − Grade 2 Net Kg` (complement)          |
| Grade 1 Net Kg         | `round(grade1Kg − proportional deduction)` — integer     |
| Grade 2 Net Kg         | `round(grade2Kg − proportional deduction)` — integer     |
| Grade 1 Amount (Rs)    | `Grade 1 Net Kg × Grade 1 Rate` — 2 decimal places       |
| Grade 2 Amount (Rs)    | `Grade 2 Net Kg × Grade 2 Rate` — 2 decimal places       |
| Total Amount (Rs)      | `Grade 1 Amount + Grade 2 Amount`                        |
| Net Pay (Rs)           | `Total Amount − Total Deductions` — 2 decimal places     |
