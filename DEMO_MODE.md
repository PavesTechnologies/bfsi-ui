# Demo Mode — Decision Cheat Sheet

Demo mode runs the full applicant journey (intake → KYC → bank review → decision →
accept/select → signature → disbursement) with **no backend running**. Turn it on in
`.env`:

```
VITE_APP_ENV=demo      # dev = real backend, demo = offline
VITE_FILL_DEFAULTS=true # prefills the form with the Rahul Mishra fixture
```

Every screen, event and payload is identical to real mode — only the transport is
swapped ([demoApi.js](src/api/demoApi.js) as an axios adapter, plus a timed event
stream in [pipelineSSE.js](src/services/pipelineSSE.js)).

---

## The one rule that decides everything

There is no hidden switch. The demo asks the same question the real decisioning agent
asks — **can the applicant's spare monthly income carry the loan?**

```
max EMI    = (monthly income × 50%) − existing monthly obligations
cap        = the largest loan whose EMI fits inside max EMI, at the requested tenure
```

| Condition | Decision |
|---|---|
| requested amount **≤ cap** | **APPROVED** |
| requested amount **> cap**, and cap ≥ ₹10,000 | **COUNTER OFFER** (3 options) |
| max EMI ≤ 0, or cap < ₹10,000 | **DECLINED** |

So: **to change the journey, change the amount, the income, or the liabilities.**

Fixed parameters: interest rate **10.9%** base, origination fee **1%**, FOIR **50%**,
maximum tenure on offer **84 months**.

---

## Fastest way to get each journey

Starting from the prefilled fixture (income ₹5,000/mo, one liability ₹350/mo, 24 months):

| Want this | Change this on the form | Where |
|---|---|---|
| **Counter offer** | nothing — this is the default (₹1,00,000) | — |
| **Approved** | Requested Amount → **₹40,000** | Step 1 · Loan Details |
| **Declined** | Liability Monthly Payment → **₹3,000** | Step 6 · Assets & Liabilities |

---

## Approval ceiling — largest amount that gets APPROVED

Anything above the cell → counter offer. Obligations held at ₹350/mo.

| Monthly income | max EMI | 12 mo | 24 mo | 36 mo | 60 mo | 84 mo |
|---|---|---|---|---|---|---|
| ₹3,000 | ₹1,150 | 13,000 | 24,000 | 35,000 | 53,000 | 67,000 |
| ₹5,000 | ₹2,150 | 24,000 | 46,000 | 65,000 | 99,000 | 1,25,000 |
| ₹8,000 | ₹3,650 | 41,000 | 78,000 | 1,11,000 | 1,68,000 | 2,13,000 |
| ₹12,000 | ₹5,650 | 63,000 | 1,21,000 | 1,72,000 | 2,60,000 | 3,30,000 |
| ₹20,000 | ₹9,650 | 1,09,000 | 2,07,000 | 2,95,000 | 4,44,000 | 5,65,000 |
| ₹40,000 | ₹19,650 | 2,22,000 | 4,22,000 | 6,01,000 | 9,05,000 | 11,51,000 |
| ₹75,000 | ₹37,150 | 4,20,000 | 7,97,000 | 11,36,000 | 17,12,000 | 21,76,000 |
| ₹1,50,000 | ₹74,650 | 8,45,000 | 16,03,000 | 22,83,000 | 34,41,000 | 43,73,000 |

Longer tenure → bigger approval. The same ₹1,00,000 on ₹5,000/mo income is a **counter
offer at 24 months** but **approved at 84 months**.

---

## Decision grid @ 24 months, obligations ₹350

| Income \ Amount | 10,000 | 25,000 | 50,000 | 1,00,000 | 2,50,000 | 5,00,000 | 10,00,000 |
|---|---|---|---|---|---|---|---|
| **₹3,000** | APPROVED | counter | counter | counter | counter | counter | counter |
| **₹5,000** | APPROVED | APPROVED | counter | counter | counter | counter | counter |
| **₹8,000** | APPROVED | APPROVED | APPROVED | counter | counter | counter | counter |
| **₹12,000** | APPROVED | APPROVED | APPROVED | APPROVED | counter | counter | counter |
| **₹20,000** | APPROVED | APPROVED | APPROVED | APPROVED | counter | counter | counter |
| **₹40,000** | APPROVED | APPROVED | APPROVED | APPROVED | APPROVED | counter | counter |
| **₹75,000** | APPROVED | APPROVED | APPROVED | APPROVED | APPROVED | APPROVED | counter |
| **₹1,50,000** | APPROVED | APPROVED | APPROVED | APPROVED | APPROVED | APPROVED | APPROVED |

---

## Getting a DECLINE

Low income alone barely triggers it — the cap only falls under ₹10,000 below roughly
**₹1,640/mo** income (at 24 months). In practice **liabilities are the lever**:

| Income ₹20,000, amount ₹1,00,000, 24 mo | max EMI | Decision |
|---|---|---|
| obligations ₹0 | ₹10,000 | APPROVED |
| obligations ₹5,000 | ₹5,000 | APPROVED |
| obligations ₹8,000 | ₹2,000 | counter offer |
| obligations ₹9,500 | ₹500 | counter offer |
| obligations **₹9,900** | ₹100 | **DECLINED** |

Reliable declines:

- **Liabilities ≥ 50% of income** → "obligations already use the full share of income".
- **No income at all** (clear Employment *and* Additional Income) → declined either way.

---

## ⚠️ Gotcha: which income field counts

Income is read the way the real pipeline reads it — **employment salary wins, and the
Additional Income step is only a fallback**:

| Form state | Income used |
|---|---|
| Employment ₹5,000 + bonus ₹800 | **₹5,000** — the bonus is ignored |
| Employment blank, incomes ₹5,000 + ₹800 | **₹5,800** — fallback sums them |
| Employment ₹0, incomes ₹5,800 | **₹5,800** — fallback sums them |
| Nothing anywhere | ₹0 → declined |

So editing the bonus on Step 5 does nothing while Step 4's *Gross Monthly Income* is
set. **Liabilities always sum** across every row.

---

## Worked examples

### Counter offer — the prefilled fixture
`₹1,00,000 · 24 mo · income ₹5,000 · obligations ₹350` → max EMI **₹2,150**, cap **₹46,176**

| | Offer | Amount | Tenure | Rate | EMI | Headroom |
|---|---|---|---|---|---|---|
| CO1 | Reduced Amount | ₹46,000 | 24 mo | 10.9% | ₹2,141.83 | 0.38% |
| CO2 | Extended Tenure | ₹1,00,000 | 84 mo | 11.5% | ₹1,738.65 | 19.13% |
| **CO3 ★** | **Balanced Option** | **₹90,000** | **54 mo** | **11.2%** | **₹2,129.40** | **0.96%** |

### Approved
`₹40,000 · 24 mo · income ₹5,000` → **₹40,000 / 24 mo @ 10.9%**, EMI ₹1,862.46, net ₹39,600

### Declined
`₹1,00,000 · 24 mo · income ₹5,000 · obligations ₹3,000` → max EMI ₹−500 → declined

### Realistic salary — approved
`₹5,00,000 · 60 mo · income ₹75,000 · obligations ₹5,000` → **approved**, EMI ₹10,846.29, net ₹4,95,000

### Realistic salary — counter offer
`₹20,00,000 · 60 mo · income ₹75,000 · obligations ₹5,000` → max EMI ₹32,500, cap ₹14,98,208

| | Offer | Amount | Tenure | Rate | EMI | Feasible |
|---|---|---|---|---|---|---|
| CO1 | Reduced Amount | ₹14,98,000 | 60 mo | 10.9% | ₹32,495.49 | yes |
| CO2 | Extended Tenure | ₹20,00,000 | 84 mo | 11.5% | ₹34,772.92 | **no** |
| **CO3 ★** | **Balanced Option** | **₹16,98,000** | **72 mo** | **11.2%** | **₹32,494.07** | **yes** |

---

## How the three counter offers are built

| | Strategy | Amount | Tenure |
|---|---|---|---|
| **CO1** Reduced Amount | shrink to fit | largest affordable at the requested tenure | as requested |
| **CO2** Extended Tenure | stretch to fit | the **full requested amount** | 84 mo (or the requested tenure, if longer) |
| **CO3** Balanced Option | meet in the middle | largest affordable at the middle tenure | midway between the two above |

- **★ = recommended.** Preference is CO3 → CO1 → CO2 — the balanced offer wins when
  feasible. Recommending the *largest* affordable amount would push applicants toward
  the option that costs the most total interest.
- **CO2 is the only option that can be `feasible: false`** — it holds the amount fixed,
  so if the EMI does not fit even at the longest tenure, nothing will. CO1 and CO3 are
  derived *from* the affordability ceiling, so they always fit.
- **CO3 disappears** when the requested tenure is already at or beyond 84 months —
  there is no middle ground left, and a "balanced" offer there would just be CO1 with a
  worse rate. You get 2 options instead of 3.

---

## Pipeline timing

Each verification phase holds for **5 seconds** (`DEMO_PHASE_DELAY_MS` in
[demoApi.js](src/api/demoApi.js)):

```
 0.0s  pipeline_accepted              orchestrator  started
 0.3s  kyc_triggered                  kyc           started
 5.3s  kyc_passed                     kyc           completed   ← phase 1  identity
 5.5s  awaiting_bank_review           decisioning   pending
10.5s  bank_decisioning_started       decisioning   started     ← phase 2  review queue
15.5s  counter_offer_review_started   decisioning   pending     ← phase 3  decisioning
20.5s  bank_counter_offers_published  decisioning   pending     ← phase 4  offer review
```

| Journey | Time to the decision screen |
|---|---|
| Counter offer | ~20.5s |
| Approved | ~15.5s |
| Declined | ~15.5s (terminal) |
| Signature → receipt | ~5s |

---

## Notes

- **State is per-session.** Application state lives in memory, exactly as the real
  orchestrator's `pipeline_state_store` does — a hard refresh loses it. Refreshing
  mid-pipeline rebuilds the scenario from the saved form data and **restarts the
  timeline** (real mode replays the orchestrator's buffered events instead). Same
  decision either way.
- **Amounts round to the nearest ₹1,000** on intake, so ₹46,400 is treated as ₹46,000.
  Offer amounts derived from the cap round *down*, so tidying the figure can never push
  the EMI back over the ceiling.
- **Every screen is reachable**: approved, counter offer, declined, signature, receipt,
  and the decline-all-offers reset.
- Changing a number here changes only the demo. Real-mode decisions come from the
  decisioning agent's RAG + 7-analyzer LangGraph flow.
