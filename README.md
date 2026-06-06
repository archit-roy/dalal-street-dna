# Dalal Street DNA

**Data science applied to Indian equity markets.**

Most tools tell you what a stock is doing. This one tells you *how* it behaves — its personality, its patterns, its tendencies. Built on real NSE data, it extracts a behavioural fingerprint for every Nifty 50 stock and makes it visual.

---

## What it does

Four modules, one platform:

### Stock DNA
Pick any Nifty 50 stock and get its complete behavioural profile — a price history chart, a multi-channel signature waveform, and 8 style dimensions scored from real data. Two stocks that look similar on a screener can have completely different DNA.

### Sector View
Pick a sector — IT, Banking, Pharma, Auto, FMCG, Energy, Metals, Finance — and analyse all its stocks together. The scatter plot shows which stocks in the sector are behavioural outliers and which ones cluster together.

### Compare
Pick 2–4 stocks from anywhere in the Nifty 50 and compare them side by side. The radar chart overlays their style profiles so you can see exactly where they diverge.

### My Trades
Upload your Zerodha or Groww trade history CSV and get a full analysis of your own trading behaviour — your win rate, which sectors you actually make money in vs which ones you think you're good at, whether you hold losers too long, and your monthly P&L waterfall.

---

## The 8 stock DNA dimensions

| Dimension | What it actually measures |
|---|---|
| **Trend strength** | R² of a log-linear fit to the price — how consistently directional the stock is |
| **Volatility** | Annualised standard deviation of log returns, normalised to 80% vol = score of 1 |
| **Volume confirms** | Correlation between volume and absolute daily returns — does smart money follow price? |
| **Mean reversion** | Negative autocorrelation of returns — does the stock snap back after moves? |
| **Momentum** | Positive 5-day autocorrelation — does it keep going after a move starts? |
| **Gap tendency** | How often the stock gaps up or down at open |
| **Intraday range** | Average daily high-low spread as % of price |
| **Relative strength** | Alpha vs Nifty 50 — is it actually outperforming the index? |

---

## The trader DNA dimensions

| Dimension | What it actually measures |
|---|---|
| **Win rate** | % of completed round trips that were profitable |
| **Profit factor** | Total gains / total losses |
| **Loss cutting** | Ratio of winner holding days to loser holding days — higher = you cut losers faster |
| **Patience** | Average holding period normalised to 30 days |
| **Consistency** | Low variance in monthly P&L = high score |
| **Diversification** | How many different sectors you trade |
| **Reward ratio** | Average win % / average loss % |
| **Activity level** | Trades per month |

---

## How it works

### Data pipeline
All price data comes from yfinance using NSE `.NS` suffixes. For each stock and time period, we fetch OHLCV data and compute derived columns — daily returns, log returns, intraday range, gap, and typical price.

### Signature generation
Every stock's data is resampled onto a fixed 252-point grid (one year of trading days) regardless of the actual time period, so you can compare a 3-month chart against a 5-year chart on the same scale.

### Behavioural scoring
Each of the 8 dimensions is computed from the raw OHLCV data using signal processing and statistical methods — autocorrelation, standard deviation, linear regression R², correlation coefficients. All values are normalised to 0–1.

### PCA scatter
When comparing multiple stocks, their 8 dimension scores are fed through PCA (Principal Component Analysis) to compress 8 dimensions into 2 for the scatter plot. Stocks close together on the scatter have similar behavioural DNA.

### Trader analysis
Trade history CSVs are parsed and matched into round trips (BUY → SELL). Each completed trade contributes to the 8 trader dimensions. The sector performance breakdown shows total P&L, win rate and number of trades per sector.

---

## Stack

**Backend** — Python, FastAPI, yfinance, Pandas, NumPy, SciPy, scikit-learn

**Frontend** — React, TypeScript, Vite, D3.js, Zustand

**Deployment** — Railway (backend), Vercel (frontend)

---

## Running locally

### Backend
```bash
cd backend
py -3.11 -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs at `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`

---

## Project structure

```
dalal-street-dna/
├── backend/
│   ├── app/
│   │   ├── main.py                     ← FastAPI entry point
│   │   ├── core/config.py              ← Settings
│   │   ├── services/
│   │   │   ├── stock_loader.py         ← yfinance wrapper, Nifty 50 data
│   │   │   ├── dna_analyzer.py         ← 8 dimension scoring, PCA
│   │   │   ├── clustering.py           ← PCA embedding for scatter
│   │   │   └── trader_analyzer.py      ← CSV parsing, trade matching, trader DNA
│   │   └── api/routes/
│   │       ├── stocks.py               ← DNA, compare, sector endpoints
│   │       └── trader.py               ← CSV upload endpoint
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api.ts                      ← Backend calls + TypeScript types
        ├── App.tsx                     ← Main layout + tab routing
        ├── stores/store.ts             ← Zustand global state
        └── components/
            ├── dna/
            │   ├── PriceChart.tsx      ← D3 price history line chart
            │   └── SignatureChart.tsx  ← D3 multi-channel waveform
            ├── radar/
            │   ├── RadarChart.tsx      ← SVG spider chart
            │   └── ScatterPlot.tsx     ← D3 PCA scatter plot
            ├── trader/
            │   └── TraderAnalyser.tsx  ← CSV upload + trader DNA UI
            └── ui/
                └── Skeleton.tsx        ← Loading placeholders
```

---

## Things worth trying

- **HDFCBANK vs ICICIBANK** — same sector, very different DNA
- **IT sector view** — see which IT stocks are momentum-driven vs mean-reverting
- **5Y period on RELIANCE** — watch how the trend strength score changes
- **Upload your own Zerodha CSV** — find out which sector you actually make money in

---

*Data via [yfinance](https://github.com/ranaroussi/yfinance). Built alongside [PitWall DNA](https://github.com/archit-roy/pitwall-dna).*