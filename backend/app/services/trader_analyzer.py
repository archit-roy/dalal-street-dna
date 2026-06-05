"""
Trader Style Analyzer — analyses a trader's behaviour from their trade history.

Supports Zerodha tradebook CSV format.
Extracts 8 trader personality dimensions.
"""
import pandas as pd
import numpy as np
from app.services.stock_loader import get_sector, get_sector_color
import logging

logger = logging.getLogger(__name__)


def parse_trades(csv_content: str) -> pd.DataFrame:
    from io import StringIO
    df = pd.read_csv(StringIO(csv_content))

    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    rename_map = {
        'trade_date':    'date',
        'order_date':    'date',
        'tradingsymbol': 'symbol',
        'tradetype':     'trade_type',
        'order_type':    'trade_type',
        'qty':           'quantity',
        'avg_price':     'price',
        'average_price': 'price',
    }
    for old, new in rename_map.items():
        if old in df.columns and new not in df.columns:
            df.rename(columns={old: new}, inplace=True)

    df['date'] = pd.to_datetime(df['date'])
    df['trade_type'] = df['trade_type'].str.upper().str.strip()
    df['symbol'] = df['symbol'].str.upper().str.strip()
    df['quantity'] = df['quantity'].astype(float)
    df['price'] = df['price'].astype(float)
    df['value'] = df['quantity'] * df['price']

    return df.sort_values('date').reset_index(drop=True)


def match_trades(df: pd.DataFrame) -> pd.DataFrame:
    completed = []

    for symbol in df['symbol'].unique():
        symbol_trades = df[df['symbol'] == symbol].copy()
        buys  = symbol_trades[symbol_trades['trade_type'] == 'BUY'].copy()
        sells = symbol_trades[symbol_trades['trade_type'] == 'SELL'].copy()

        buy_queue  = buys.to_dict('records')
        sell_queue = sells.to_dict('records')

        for sell in sell_queue:
            remaining_sell = sell['quantity']
            sell_value     = 0

            for buy in buy_queue:
                if buy['quantity'] <= 0 or remaining_sell <= 0:
                    continue
                matched    = min(buy['quantity'], remaining_sell)
                sell_value += matched * sell['price']
                buy_cost   = matched * buy['price']
                pnl        = sell_value - buy_cost
                holding_days = (sell['date'] - buy['date']).days

                completed.append({
                    'symbol':       symbol,
                    'sector':       get_sector(symbol),
                    'sector_color': get_sector_color(symbol),
                    'buy_date':     buy['date'],
                    'sell_date':    sell['date'],
                    'holding_days': holding_days,
                    'quantity':     matched,
                    'buy_price':    buy['price'],
                    'sell_price':   sell['price'],
                    'buy_value':    buy_cost,
                    'sell_value':   sell_value,
                    'pnl':          pnl,
                    'pnl_pct':      (sell['price'] / buy['price'] - 1) * 100,
                    'is_winner':    pnl > 0,
                })

                buy['quantity'] -= matched
                remaining_sell  -= matched
                sell_value       = 0

    return pd.DataFrame(completed) if completed else pd.DataFrame()


def compute_trader_dimensions(trades: pd.DataFrame) -> list[dict]:
    if trades.empty:
        return []

    dims = {}

    winners = trades[trades['is_winner']]
    losers  = trades[~trades['is_winner']]

    dims["win_rate"] = float(len(winners) / len(trades))

    total_gain = float(winners['pnl'].sum()) if not winners.empty else 0
    total_loss = abs(float(losers['pnl'].sum())) if not losers.empty else 1
    dims["profit_factor"] = float(np.clip(total_gain / (total_loss + 1e-6) / 3, 0, 1))

    avg_winner_days = float(winners['holding_days'].mean()) if not winners.empty else 1
    avg_loser_days  = float(losers['holding_days'].mean()) if not losers.empty else 1
    ratio = avg_winner_days / (avg_loser_days + 1e-6)
    dims["loss_cutting"] = float(np.clip(ratio, 0, 1))

    avg_hold = float(trades['holding_days'].mean())
    dims["patience"] = float(np.clip(avg_hold / 30, 0, 1))

    trades['month'] = trades['sell_date'].dt.to_period('M')
    monthly_pnl = trades.groupby('month')['pnl'].sum()
    if len(monthly_pnl) > 1:
        cv = float(np.std(monthly_pnl) / (abs(np.mean(monthly_pnl)) + 1e-6))
        dims["consistency"] = float(np.clip(1 - cv / 3, 0, 1))
    else:
        dims["consistency"] = 0.5

    n_sectors = trades['sector'].nunique()
    dims["diversification"] = float(np.clip(n_sectors / 8, 0, 1))

    avg_win  = float(winners['pnl_pct'].mean()) if not winners.empty else 0
    avg_loss = abs(float(losers['pnl_pct'].mean())) if not losers.empty else 1
    dims["reward_ratio"] = float(np.clip(avg_win / (avg_loss + 1e-6) / 2, 0, 1))

    n_months = max(1, (trades['sell_date'].max() - trades['sell_date'].min()).days / 30)
    trades_per_month = len(trades) / n_months
    dims["activity"] = float(np.clip(trades_per_month / 10, 0, 1))

    labels = {
        "win_rate":        "Win rate",
        "profit_factor":   "Profit factor",
        "loss_cutting":    "Loss cutting",
        "patience":        "Patience",
        "consistency":     "Consistency",
        "diversification": "Diversification",
        "reward_ratio":    "Reward ratio",
        "activity":        "Activity level",
    }

    return [
        {"name": k, "label": labels[k], "value": float(np.clip(v, 0, 1))}
        for k, v in dims.items()
    ]


def compute_sector_performance(trades: pd.DataFrame) -> list[dict]:
    if trades.empty:
        return []

    sector_stats = []
    for sector in trades['sector'].unique():
        s = trades[trades['sector'] == sector]
        total_pnl = float(s['pnl'].sum())
        win_rate  = float(len(s[s['is_winner']]) / len(s))
        n_trades  = int(len(s))
        sector_stats.append({
            "sector":       sector,
            "sector_color": get_sector_color(s['symbol'].iloc[0]),
            "total_pnl":    total_pnl,
            "win_rate":     win_rate,
            "n_trades":     n_trades,
        })

    return sorted(sector_stats, key=lambda x: x['total_pnl'], reverse=True)


def analyse_trader(csv_content: str) -> dict:
    df     = parse_trades(csv_content)
    trades = match_trades(df)

    if trades.empty:
        raise ValueError("No completed trades found in the CSV")

    dimensions  = compute_trader_dimensions(trades)
    sector_perf = compute_sector_performance(trades)

    winners = trades[trades['is_winner']]
    losers  = trades[~trades['is_winner']]

    trades['month'] = trades['sell_date'].dt.to_period('M')
    monthly = trades.groupby('month').agg(
        pnl=('pnl', 'sum'),
        trades=('pnl', 'count'),
    ).reset_index()
    monthly['month'] = monthly['month'].astype(str)

    best_trade  = trades.loc[trades['pnl'].idxmax()]
    worst_trade = trades.loc[trades['pnl'].idxmin()]

    trade_records = trades[
        ['symbol', 'sector', 'sector_color',
         'buy_date', 'sell_date', 'holding_days',
         'buy_price', 'sell_price', 'pnl', 'pnl_pct', 'is_winner']
    ].copy()
    trade_records['buy_date']  = trade_records['buy_date'].dt.strftime('%Y-%m-%d')
    trade_records['sell_date'] = trade_records['sell_date'].dt.strftime('%Y-%m-%d')

    return {
        "total_trades":       int(len(trades)),
        "total_pnl":          float(trades['pnl'].sum()),
        "win_rate":           float(len(winners) / len(trades)),
        "avg_holding_days":   float(trades['holding_days'].mean()),
        "avg_winner_days":    float(winners['holding_days'].mean()) if not winners.empty else 0,
        "avg_loser_days":     float(losers['holding_days'].mean()) if not losers.empty else 0,
        "best_trade": {
            "symbol":  str(best_trade['symbol']),
            "pnl":     float(best_trade['pnl']),
            "pnl_pct": float(best_trade['pnl_pct']),
            "days":    int(best_trade['holding_days']),
        },
        "worst_trade": {
            "symbol":  str(worst_trade['symbol']),
            "pnl":     float(worst_trade['pnl']),
            "pnl_pct": float(worst_trade['pnl_pct']),
            "days":    int(worst_trade['holding_days']),
        },
        "style_dimensions":   dimensions,
        "sector_performance": sector_perf,
        "monthly_pnl":        monthly.to_dict('records'),
        "trades":             trade_records.to_dict('records'),
    }