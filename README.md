<div align="center">

# 📈 NodoQuant

### Quantitative Strategy Analysis Platform

**Discover the statistical edge of your trading strategy**

Next.js · TypeScript · Supabase · Recharts · Vitest · Quantitative Analysis

</div>

---

## 🎯 Executive Summary

**NodoQuant** is a quantitative analysis platform designed to evaluate trading strategies through measurable statistical evidence.

Instead of asking only whether a strategy was profitable, the platform is built around a more useful question:

> **Does this strategy show a repeatable statistical edge — and what risks come with it?**

NodoQuant combines strategy analysis, performance metrics, dashboards, comparison views and account-based workflows in a web product built with Next.js and TypeScript.

The repository includes dedicated analyzer experiences, dashboards, strategy views, project organization, comparison tools, authentication, account pages and multilingual routing.

---

## 🧩 What the Product Does

NodoQuant is designed to help users inspect the quality of a trading strategy from several angles.

The current product structure includes:

- strategy analysis,
- quantitative performance metrics,
- crypto strategy analysis,
- forex strategy analysis,
- strategy dashboards,
- project organization,
- strategy comparison,
- account management,
- authentication,
- report/certificate views,
- multilingual routing,
- subscription and billing flows,
- administrative metrics and subscription views.

The goal is to move from:

```text
"My strategy made money"
```

to:

```text
"How strong is the statistical evidence,
how stable is the strategy,
and what level of risk produced those results?"
```

---

## 📊 Quantitative Focus

The platform surfaces metrics such as:

- **Win Rate**
- **Profit Factor**
- **Expectancy**
- **Maximum Drawdown**
- **Number of Trades**
- strategy scoring

These metrics are useful because no single number tells the whole story.

For example:

```text
High Win Rate
      ≠
Strong Strategy
```

A strategy can win often and still lose money if losses are much larger than wins.

Likewise:

```text
Positive Return
      ≠
Acceptable Risk
```

A profitable strategy may still be unattractive if drawdowns are too large or results are driven by too few observations.

---

## 🧠 The Core Analytical Question

A quantitative strategy should be evaluated as a system of trade-offs.

```text
Profitability
     +
Consistency
     +
Risk
     +
Sample Size
     +
Statistical Evidence
     ↓
Strategy Quality
```

NodoQuant is built around this perspective.

The product is not intended to present trading results as certainty. Its role is to organize evidence and make strategy evaluation more disciplined.

---

## 🔄 Product Workflow

```text
Trading Strategy
      ↓
Trade / Performance Data
      ↓
Quantitative Analysis
      ↓
Core Metrics
      ↓
Strategy Score
      ↓
Dashboard
      ↓
Compare Strategies
      ↓
Decision Support
```

---

## 🖥️ Product Areas

### Strategy Analyzer

The analyzer is the core entry point for evaluating a strategy.

The app also includes dedicated landing experiences for:

- **Crypto Strategy Analyzer**
- **Forex Strategy Analyzer**

These pages connect into the common analysis flow.

### Dashboard

The dashboard provides an operational view of saved strategy analysis and user activity.

Available areas include:

```text
Dashboard
├── Analytics
├── Projects
├── Strategies
└── Compare
```

### Strategy Comparison

The comparison area is designed to evaluate multiple strategies side by side rather than looking at each result in isolation.

This is especially useful when strategies differ across:

- profitability,
- consistency,
- drawdown,
- trade frequency,
- expectancy,
- overall score.

### Reports & Certificates

The application includes report/certificate routes for presenting analysis results in a shareable format.

---

## 🏗️ Application Architecture

NodoQuant is built as a modern web application using the Next.js App Router.

```text
app/
├── [locale]/
│   ├── account/
│   ├── analyzer/
│   ├── admin/
│   ├── billing/
│   ├── certificate/
│   ├── crypto-strategy-analyzer/
│   ├── dashboard/
│   │   ├── analytics/
│   │   ├── compare/
│   │   ├── projects/
│   │   └── strategies/
│   ├── forex-strategy-analyzer/
│   ├── leaderboard/
│   └── login/
├── api/
└── emails/
```

The project also includes server-side integrations, multilingual routing and account-based product flows.

---

## 🛠️ Tech Stack

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/Recharts-Visualization-8884D8">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white">
  <img src="https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white">
  <img src="https://img.shields.io/badge/Resend-Email-000000">
</p>

**Core stack:** Next.js 14 · React 18 · TypeScript · Supabase · Recharts · Tailwind CSS · next-intl · Vitest · Resend

---

## 🌍 Internationalization

The application uses locale-based routing through:

```text
app/[locale]/
```

and `next-intl`.

This allows product pages and analysis experiences to be presented across multiple locales without duplicating the main application structure.

---

## 🧪 Testing

The repository includes a dedicated analyzer test command:

```bash
npm run test:analyzer
```

powered by **Vitest**.

Available project scripts include:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:analyzer
```

---

## ▶️ Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run analyzer tests:

```bash
npm run test:analyzer
```

Environment variables can be configured from:

```text
.env.local.example
```

---

## 🔐 Backend & Product Infrastructure

The project uses **Supabase** for backend functionality and includes product infrastructure for:

- authenticated users,
- account pages,
- stored strategies and projects,
- subscription flows,
- admin views,
- email-related workflows.

This gives NodoQuant a broader product architecture than a standalone analytics notebook.

---

## 💡 Product Philosophy

A trading strategy should not be judged by a screenshot of profit.

A more disciplined process asks:

```text
Was the result repeatable?
Was the sample large enough?
How severe was the drawdown?
Was expectancy positive?
Was the edge consistent?
```

NodoQuant is designed to make those questions part of the product itself.

---

## ⚠️ Limitations

- Statistical analysis does not guarantee future trading performance.
- Historical performance can be affected by overfitting and market regime changes.
- A strategy score should be interpreted together with its underlying metrics.
- Small sample sizes can create misleading conclusions.
- Backtest results may differ materially from live execution.
- Trading costs, slippage and data quality can materially affect real-world outcomes.
- The repository currently contains development/build artifacts that should be cleaned up for a more production-ready public structure.

---

## 🚀 Potential Next Steps

- Clean development logs and temporary build artifacts from the repository.
- Expand analyzer test coverage.
- Add clearer methodology documentation for the scoring model.
- Add statistical confidence intervals.
- Add bootstrap or Monte Carlo robustness analysis.
- Add walk-forward validation.
- Add deeper drawdown and risk decomposition.
- Add strategy-regime comparison.
- Add public-safe screenshots to the README.
- Document data-input requirements and validation rules.

---

## 👤 Author

**Guido Arturo Broccoli**

[LinkedIn](https://www.linkedin.com/in/guido-a-broccoli) ·
[GitHub](https://github.com/GabArg) ·
[Repository](https://github.com/GabArg/nodoquant)

---

## 📄 Disclaimer

NodoQuant is an analytical and educational tool.

It does not provide financial advice, guarantee profitability or predict future market performance.
