# WealthOS — Project Spec

## Overview
100% client-side React app. No backend, no server, no database.
Runs entirely in the browser. Data stored in localStorage.
Hosted on GitHub Pages.

## Tech stack
- React 18 + Vite
- TypeScript
- Tailwind CSS
- SheetJS (xlsx) — parse .xlsx files in browser
- PapaParse — parse .csv files in browser
- xirr (npm) — XIRR calculation in JS
- Recharts — charts
- Zustand — client state management
- Deploy: vite build → gh-pages branch via `gh-pages` npm package

## Deployment
vite.config.ts base: '/wealthos/'
package.json scripts: "predeploy": "npm run build", "deploy": "gh-pages -d dist"

## Data flow
1. User drags file onto upload zone
2. Browser reads file bytes (FileReader API)
3. Parser detects file type and extracts data
4. Parsed data written to localStorage under namespaced keys
5. Dashboard reads from localStorage and renders
6. On each successful parse, a dated wealth snapshot is appended to localStorage history

## localStorage schema
- wealthos:mf_holdings        → JSON array of MF scheme objects
- wealthos:equity_holdings    → JSON array of equity holding objects
- wealthos:fo_trades          → JSON array of F&O contract objects
- wealthos:fd_list            → JSON array of FD objects
- wealthos:wealth_snapshots   → JSON array of {date, total, mf, equity, fo_pnl, fd}
- wealthos:upload_log         → JSON array of {filename, asset_class, parsed_at, record_count, warnings}
- wealthos:last_updated       → ISO date string

## File formats

### 1. MF Central CAS (Excel .xlsx)
- Sheet: "Portfolio Details", header row index 9
- Columns: Scheme_Name, AMC, Category, Folio, Invested, Current_Value, Returns, Units
- Skip rows where Scheme_Name empty or len < 5
- Zero Invested → is_active:false
- Detection: sheet "Portfolio Details" AND cell A1 contains "Name"
- Sheet: "Transaction Details", header row index 9

### 2. Zerodha Equity Holdings (CSV)
- PapaParse, header:true
- Columns: Instrument, Qty., Avg. cost, LTP, Invested, Cur. val, P&L, Net chg., Day chg.
- ETF if Instrument contains: CASE, BEES, ETF, NIFTY
- Detection: first line contains "Instrument" AND "Avg. cost" AND "Cur. val"

### 3. Zerodha F&O P&L (Excel .xlsx)
- Sheet: "F&O", header row index 37
- Keep rows where Symbol starts with: NIFTY, SENSEX, BANKNIFTY, FINNIFTY
- Extract Total Realized P&L and Charges from rows 4-14
- Detection: sheet "F&O" AND contains "Client ID" near top

## TypeScript interfaces → see src/types/index.ts

## Validation constants
- MF: invested=2051733.25, current=2966538.69, gain=914805.44, active_schemes=11
- Equity: invested=766258.06, current=825972.45, pnl=59714.39, holdings=11
- F&O: realized_pnl=30738.25, charges=4651.74, contracts=99, winners=52, losers=47

## Design
- Dark mode: class-based (dark:)
- Colors: MF=#378ADD, Equity=#1D9E75, FO=#D4537E, FD=#EF9F27
- Gains: text-green-600 dark:text-green-400
- Losses: text-red-600 dark:text-red-400
- Background: bg-gray-50 dark:bg-gray-950
- Cards: bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800

## Build order
1. Scaffold ✅
2. Types + Store
3. Parsers (validate against constants before proceeding)
4. Calculators
5. Components
6. Pages
7. Wiring + dark mode + responsive
8. Deploy config
