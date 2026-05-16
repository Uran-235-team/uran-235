import random
import re
from pathlib import Path

TICK_RATE = 0.2
MAX_CHANGE_PCT = 0.02

SEED_RATES: dict[str, float] = {
    "USD": 91.24, "EUR": 98.45, "CNY": 12.65, "GBP": 115.12, "CHF": 101.34,
    "JPY": 0.6123, "TRY": 2.84, "KZT": 0.2045, "BYN": 27.85, "AED": 24.84,
    "INR": 1.09, "GEL": 34.12, "AMD": 0.231, "RSD": 0.845, "THB": 2.48,
    "CAD": 67.15, "AUD": 60.32, "NZD": 55.45, "SGD": 67.89, "HKD": 11.67,
    "SEK": 8.75, "NOK": 8.54, "DKK": 13.21, "PLN": 22.84, "CZK": 3.94,
    "HUF": 0.251, "RON": 19.82, "BGN": 50.34, "ILS": 24.56, "SAR": 24.32,
    "QAR": 25.04, "KWD": 296.50, "BHD": 241.90, "OMR": 236.80, "ZAR": 4.87,
    "EGP": 1.91, "NGN": 0.062, "KES": 0.68, "BRL": 18.23, "MXN": 5.41,
    "CLP": 0.098, "ARS": 0.105, "COP": 0.023, "PEN": 24.54, "KRW": 0.068,
    "TWD": 2.89, "MYR": 19.23, "IDR": 0.0058, "PHP": 1.62, "VND": 0.0036,
    "LKR": 0.301, "PKR": 0.328, "BDT": 0.78, "UZS": 0.0072, "TJS": 8.35,
    "TMT": 26.07, "KGS": 1.02, "AZN": 53.67, "MDL": 5.14, "ALL": 0.98,
    "BAM": 50.34, "MKD": 1.60, "ISK": 0.65, "MOP": 11.32, "MNT": 0.026,
    "MMK": 0.043, "KHR": 0.022, "LAK": 0.0043, "NPR": 0.68, "MUR": 1.98,
    "MAD": 9.12, "TND": 29.34, "DZD": 0.68, "LYD": 18.94, "GHS": 6.84,
    "UGX": 0.024, "TZS": 0.035, "ETB": 1.61, "MZN": 1.43, "AOA": 0.109,
    "JOD": 128.50, "LBP": 0.001, "SYP": 0.007, "IQD": 0.069, "IRR": 0.0021,
    "AFN": 1.28, "YER": 0.36, "SOS": 0.16, "SLL": 0.004, "LRD": 0.47,
    "GMD": 1.34, "MRO": 0.23, "CVE": 0.89, "STD": 0.004, "SCR": 6.78,
    "SZL": 4.87, "LSL": 4.87, "BWP": 6.72, "MWK": 0.053, "ZMW": 3.48,
    "BIF": 0.032, "RWF": 0.071, "KMF": 0.20, "DJF": 0.51, "ERN": 6.08,
    "SDG": 0.15, "SSP": 0.07, "XAF": 0.15, "XOF": 0.15, "XPF": 0.82,
    "FJD": 40.56, "SBD": 10.84, "VUV": 0.76, "TOP": 38.54, "WST": 33.42,
    "PGK": 24.12, "BZD": 45.23, "GTQ": 11.72, "HNL": 3.70, "NIO": 2.48,
    "CRC": 0.17, "PAB": 91.24, "CUP": 3.80, "DOP": 1.56, "HTG": 0.69,
    "JMD": 0.58, "TTD": 13.45, "BBD": 45.62, "XCD": 33.79, "SRD": 2.45,
    "GYD": 0.44, "UYU": 2.36, "PYG": 0.012, "BOB": 13.20, "AWG": 50.69,
    "KYD": 109.45, "BMD": 91.24, "FKP": 115.12, "SHP": 115.12, "GIP": 115.12,
}


class ExchangeEmulator:
    def __init__(self, exchange_id: str, title: str) -> None:
        self.exchange_id = exchange_id
        self.title = title
        self.rates: dict[str, float] = dict(SEED_RATES)
        self._rng = random.Random()

    def tick(self) -> None:
        for currency in self.rates:
            change = self._rng.uniform(-MAX_CHANGE_PCT, MAX_CHANGE_PCT)
            self.rates[currency] = round(self.rates[currency] * (1 + change), 4)

    def snapshot(self) -> dict[str, float]:
        return dict(self.rates)


_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


def _strip_quotes(s: str) -> str:
    s = s.strip()
    if len(s) >= 2 and (
        (s[0] == '"' and s[-1] == '"') or (s[0] == "'" and s[-1] == "'")
    ):
        return s[1:-1]
    return s


def load_exchanges(path: str | Path) -> list[dict[str, str]]:
    text = Path(path).read_text()
    exchanges: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    in_list = False

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped == "exchanges:":
            in_list = True
            continue
        if not in_list:
            continue

        m = re.match(r"^\s*-\s+(\w+)\s*:\s*(.+)$", line)
        if m:
            current = {m.group(1): _strip_quotes(m.group(2))}
            exchanges.append(current)
            continue

        if re.match(r"^\s*-\s*$", line):
            current = {}
            exchanges.append(current)
            continue

        m = re.match(r"^\s+(\w+)\s*:\s*(.+)$", line)
        if m and current is not None:
            current[m.group(1)] = _strip_quotes(m.group(2))

    seen: set[str] = set()
    for ex in exchanges:
        eid = ex.get("id", "")
        title = ex.get("title", "")
        if not _ID_RE.fullmatch(eid):
            raise ValueError(f"invalid exchange id {eid!r}")
        if not title:
            raise ValueError(f"exchange {eid!r} is missing title")
        if eid in seen:
            raise ValueError(f"duplicate exchange id {eid!r}")
        seen.add(eid)

    return exchanges
