import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CurrencyChartSeries, Exchange, LiveRates, PricedRates } from '@/entities/exchange/types'
import type { Rule } from '@/entities/rule/types'
import type { RuleSet } from '@/entities/rule-set/types'
import { formatDecimal } from '@/shared/lib/format'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'
const CHART_VISIBILITY_THRESHOLD = 0.2

type CurrencyMeta = {
  symbol?: string
  name?: string
  flag: string | null
}

type ResolvedCurrencyMeta = {
  symbol: string
  name: string
  flag: string | null
}

const CURRENCY_META: Record<string, CurrencyMeta> = {
  EUR: { symbol: '€', name: 'Euro', flag: 'eu' },
  USD: { symbol: '$', name: 'US Dollar', flag: 'us' },
  AWG: { symbol: 'ƒ', name: 'Aruban Florin', flag: 'aw' },
  AZN: { symbol: '₼', name: 'Azerbaijani Manat', flag: 'az' },
  CNY: { symbol: '¥', name: 'Yuan', flag: 'cn' },
  JPY: { symbol: '¥', name: 'Yen', flag: 'jp' },
  BAM: { symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark', flag: 'ba' },
  BBD: { symbol: '$', name: 'Barbadian Dollar', flag: 'bb' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', flag: 'bd' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev', flag: 'bg' },
  BHD: { symbol: 'BD', name: 'Bahraini Dinar', flag: 'bh' },
  BIF: { symbol: 'FBu', name: 'Burundian Franc', flag: 'bi' },
  BMD: { symbol: '$', name: 'Bermudan Dollar', flag: 'bm' },
  BOB: { symbol: 'Bs', name: 'Boliviano', flag: 'bo' },
  GBP: { symbol: '£', name: 'Pound', flag: 'gb' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', flag: 'ch' },
  TRY: { symbol: '₺', name: 'Lira', flag: 'tr' },
  INR: { symbol: '₹', name: 'Rupee', flag: 'in' },
  BRL: { symbol: 'R$', name: 'Real', flag: 'br' },
  MXN: { symbol: 'Mex$', name: 'Peso', flag: 'mx' },
  KRW: { symbol: '₩', name: 'Won', flag: 'kr' },
  IDR: { symbol: 'Rp', name: 'Rupiah', flag: 'id' },
  RUB: { symbol: '₽', name: 'Ruble', flag: 'ru' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: 'au' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: 'ca' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', flag: 'nz' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: 'sg' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', flag: 'hk' },
  AED: { symbol: 'AED', name: 'UAE Dirham', flag: 'ae' },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal', flag: 'sa' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', flag: 'se' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', flag: 'no' },
  DKK: { symbol: 'kr', name: 'Danish Krone', flag: 'dk' },
  PLN: { symbol: 'zł', name: 'Polish Zloty', flag: 'pl' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', flag: 'cz' },
  UAH: { symbol: '₴', name: 'Hryvnia', flag: 'ua' },
  KZT: { symbol: '₸', name: 'Tenge', flag: 'kz' },
  THB: { symbol: '฿', name: 'Baht', flag: 'th' },
  VND: { symbol: '₫', name: 'Dong', flag: 'vn' },
  BTC: { symbol: '₿', name: 'Bitcoin', flag: 'btc' },
  ETH: { symbol: 'ETH', name: 'Ethereum', flag: 'eth' },
  USDT: { symbol: '₮', name: 'Tether', flag: 'usdt' },
  USDC: { symbol: 'USDC', name: 'USD Coin', flag: 'usdc' },
}

const currencyNames =
  typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'currency' })
    : null

const MANUAL_FLAG_CODES = new Set([
  'eu',
  'us',
  'cn',
  'jp',
  'gb',
  'ch',
  'tr',
  'in',
  'br',
  'mx',
  'kr',
  'id',
  'ru',
  'au',
  'ca',
  'nz',
  'sg',
  'hk',
  'ae',
  'sa',
  'se',
  'no',
  'dk',
  'pl',
  'cz',
  'ua',
  'kz',
  'th',
  'vn',
])

const resolvedCurrencyMetaCache = new Map<string, ResolvedCurrencyMeta>()

function formatClock(timestamp: number | null) {
  if (timestamp == null) return 'ещё не обновлялся'

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

function CurrencyLineChart({
  points,
  isVisible,
}: {
  points: CurrencyChartSeries[string] | undefined
  isVisible: boolean
}) {
  if (!isVisible) {
    return (
      <svg viewBox="0 0 230 64" role="img" aria-label="График вне зоны видимости">
        <path className="spark-grid" d="M0 13H230M0 32H230M0 51H230" />
      </svg>
    )
  }

  if (!points || points.length < 2) {
    return (
      <svg viewBox="0 0 230 64" role="img" aria-label="Нет данных для графика">
        <path className="spark-grid" d="M0 13H230M0 32H230M0 51H230" />
      </svg>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 6, right: 0, bottom: 6, left: 0 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip
          cursor={false}
          labelFormatter={(value) =>
            formatClock(typeof value === 'number' ? value : Number(value))
          }
          formatter={(value, name) => {
            const numericValue =
              typeof value === 'number'
                ? value
                : typeof value === 'string'
                  ? Number(value)
                  : null

            if (numericValue == null || !Number.isFinite(numericValue)) return ['-', name]
            return [formatDecimal(numericValue), name === 'raw' ? 'RUB' : 'Расчёт']
          }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid rgba(47, 127, 148, 0.18)',
            background: 'rgba(255,255,255,0.96)',
            color: '#26323b',
          }}
        />
        <Line
          type="monotone"
          dataKey="raw"
          stroke="#2f7f94"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="final"
          stroke="#8b70b8"
          strokeWidth={1.6}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function statusText(status: Status) {
  switch (status) {
    case 'connecting':
      return 'Подключение'
    case 'open':
      return 'Live'
    case 'closed':
      return 'Отключено'
    case 'error':
      return 'Ошибка'
    default:
      return 'Выберите биржу'
  }
}

function inferCurrencySymbol(code: string) {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0)
    const symbol = parts.find((part) => part.type === 'currency')?.value?.trim()
    if (symbol && symbol !== code) return symbol
  } catch {
    // Ignore invalid or unsupported currency codes and fall back to a text monogram.
  }

  return code.length > 4 ? code.slice(0, 4) : code
}

function inferCurrencyName(code: string) {
  return currencyNames?.of(code) ?? code
}

function inferCurrencyFlag(code: string) {
  if (!/^[A-Z]{3}$/.test(code) || code.startsWith('X')) return null
  return code.slice(0, 2).toLowerCase()
}

function symbolClassName(symbol: string) {
  if (symbol.length > 3) return 'currency-symbol is-wide'
  if (symbol.length > 2) return 'currency-symbol is-long'
  return 'currency-symbol'
}

function symbolFontSize(symbol: string) {
  if (symbol.length > 3) return 10
  if (symbol.length > 2) return 12
  if (symbol.length > 1) return 16
  return 22
}

function CurrencySymbolIcon({ code, symbol }: { code: string; symbol: string }) {
  return (
    <span className={symbolClassName(symbol)} aria-hidden="true">
      <svg viewBox="0 0 44 32" role="img" aria-label={`${code} symbol`}>
        <text
          x="22"
          y="17"
          fill="currentColor"
          fontFamily="Inter Tight, Segoe UI, system-ui, sans-serif"
          fontSize={symbolFontSize(symbol)}
          fontWeight="800"
          dominantBaseline="middle"
          textAnchor="middle"
          letterSpacing={symbol.length > 3 ? '-0.2px' : undefined}
        >
          {symbol}
        </text>
      </svg>
    </span>
  )
}

function FlagMonogram({ text }: { text: string }) {
  return (
    <svg viewBox="0 0 36 24" role="img" aria-label={`${text} flag fallback`}>
      <rect width="36" height="24" rx="4" fill="#112028" />
      <rect x="1" y="1" width="34" height="22" rx="3" fill="#102228" />
      <text
        x="18"
        y="14.3"
        fill="#dcecea"
        fontFamily="Inter Tight, Segoe UI, system-ui, sans-serif"
        fontSize="8.8"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing=".4px"
      >
        {text}
      </text>
    </svg>
  )
}

function ExternalCountryFlag({
  countryCode,
}: {
  countryCode: string
}) {
  const [failed, setFailed] = useState(false)

  function handleError(_event: SyntheticEvent<HTMLImageElement>) {
    setFailed(true)
  }

  if (failed) {
    return <FlagMonogram text={countryCode.toUpperCase()} />
  }

  return (
    <img
      src={`https://flagcdn.com/${countryCode}.svg`}
      alt=""
      width={36}
      height={24}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  )
}

function CurrencyFlag({ code, flag }: { code: string; flag: string | null }) {
  if (flag && /^[a-z]{2}$/.test(flag) && !MANUAL_FLAG_CODES.has(flag)) {
    return <ExternalCountryFlag countryCode={flag} />
  }

  switch (flag) {
    case 'eu':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#244aa5" />
          <g fill="#ffd84d">
            <circle cx="18" cy="5" r="1.1" />
            <circle cx="21.5" cy="6" r="1.1" />
            <circle cx="24" cy="8.8" r="1.1" />
            <circle cx="25" cy="12" r="1.1" />
            <circle cx="24" cy="15.2" r="1.1" />
            <circle cx="21.5" cy="18" r="1.1" />
            <circle cx="18" cy="19" r="1.1" />
            <circle cx="14.5" cy="18" r="1.1" />
            <circle cx="12" cy="15.2" r="1.1" />
            <circle cx="11" cy="12" r="1.1" />
            <circle cx="12" cy="8.8" r="1.1" />
            <circle cx="14.5" cy="6" r="1.1" />
          </g>
        </svg>
      )
    case 'us':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <g fill="#bf2f45">
            <rect y="0" width="36" height="2" />
            <rect y="4" width="36" height="2" />
            <rect y="8" width="36" height="2" />
            <rect y="12" width="36" height="2" />
            <rect y="16" width="36" height="2" />
            <rect y="20" width="36" height="2" />
          </g>
          <rect width="16" height="12" fill="#294a8d" />
          <g fill="#fff">
            <circle cx="3" cy="3" r=".6" />
            <circle cx="7" cy="3" r=".6" />
            <circle cx="11" cy="3" r=".6" />
            <circle cx="5" cy="6" r=".6" />
            <circle cx="9" cy="6" r=".6" />
            <circle cx="13" cy="6" r=".6" />
            <circle cx="3" cy="9" r=".6" />
            <circle cx="7" cy="9" r=".6" />
            <circle cx="11" cy="9" r=".6" />
          </g>
        </svg>
      )
    case 'cn':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#dd2d2d" />
          <path
            fill="#ffd34f"
            d="m8 4 1.2 3.4h3.6L9.9 9.5l1.1 3.4L8 10.8 5 12.9l1.1-3.4-2.9-2.1h3.6z"
          />
          <g fill="#ffd34f">
            <circle cx="16" cy="5" r="1" />
            <circle cx="20" cy="8" r="1" />
            <circle cx="20" cy="13" r="1" />
            <circle cx="16" cy="16" r="1" />
          </g>
        </svg>
      )
    case 'jp':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <circle cx="18" cy="12" r="6.3" fill="#c9324b" />
        </svg>
      )
    case 'gb':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#203b7a" />
          <path d="M0 0 36 24M36 0 0 24" stroke="#fff" strokeWidth="5" />
          <path d="M0 0 36 24M36 0 0 24" stroke="#d8424f" strokeWidth="2.6" />
          <path d="M18 0v24M0 12h36" stroke="#fff" strokeWidth="8" />
          <path d="M18 0v24M0 12h36" stroke="#d8424f" strokeWidth="4.6" />
        </svg>
      )
    case 'ch':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#d52f3a" />
          <path fill="#fff" d="M15 5h6v5h5v4h-5v5h-6v-5h-5v-4h5z" />
        </svg>
      )
    case 'tr':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#d62d36" />
          <circle cx="15" cy="12" r="6" fill="#fff" />
          <circle cx="17.2" cy="12" r="4.8" fill="#d62d36" />
          <path
            fill="#fff"
            d="m24 8.2 1 2.5 2.7.2-2.1 1.7.7 2.6-2.3-1.4-2.3 1.4.7-2.6-2.1-1.7 2.7-.2z"
          />
        </svg>
      )
    case 'in':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="8" fill="#f39a3d" />
          <rect y="8" width="36" height="8" fill="#fff" />
          <rect y="16" width="36" height="8" fill="#24935b" />
          <circle cx="18" cy="12" r="3" fill="none" stroke="#31519a" strokeWidth="1" />
          <circle cx="18" cy="12" r=".8" fill="#31519a" />
        </svg>
      )
    case 'br':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#229457" />
          <path fill="#f2d24b" d="M18 3 33 12 18 21 3 12z" />
          <circle cx="18" cy="12" r="5.2" fill="#234b9b" />
        </svg>
      )
    case 'mx':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="12" height="24" fill="#17834f" />
          <rect x="12" width="12" height="24" fill="#fff" />
          <rect x="24" width="12" height="24" fill="#c93a3f" />
          <circle cx="18" cy="12" r="2.2" fill="#9d7440" />
        </svg>
      )
    case 'kr':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <path
            d="M18 6a6 6 0 0 1 0 12 3 3 0 0 1 0-6 3 3 0 0 0 0-6Z"
            fill="#d9434b"
          />
          <path
            d="M18 6a3 3 0 0 1 0 6 3 3 0 0 0 0 6 6 6 0 0 1 0-12Z"
            fill="#3158a7"
          />
          <g stroke="#111" strokeWidth="1.2">
            <path d="m7 5 5 3M8 3.5l5 3M6 6.5l5 3M25 16l5 3M24 17.5l5 3M26 14.5l5 3" />
          </g>
        </svg>
      )
    case 'id':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="12" fill="#d9343f" />
          <rect y="12" width="36" height="12" fill="#fff" />
        </svg>
      )
    case 'ru':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="8" fill="#fff" />
          <rect y="8" width="36" height="8" fill="#2950a3" />
          <rect y="16" width="36" height="8" fill="#cf3f4a" />
        </svg>
      )
    case 'au':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#1b3f8b" />
          <rect width="16" height="10" fill="#203b7a" />
          <path d="M0 0 16 10M16 0 0 10" stroke="#fff" strokeWidth="2.3" />
          <path d="M0 0 16 10M16 0 0 10" stroke="#d8424f" strokeWidth="1.1" />
          <path d="M8 0v10M0 5h16" stroke="#fff" strokeWidth="3.6" />
          <path d="M8 0v10M0 5h16" stroke="#d8424f" strokeWidth="2" />
          <g fill="#fff">
            <circle cx="23" cy="8" r="1.2" />
            <circle cx="29" cy="12" r="1.4" />
            <circle cx="24.5" cy="16.5" r="1.2" />
            <circle cx="31" cy="18" r="1" />
          </g>
        </svg>
      )
    case 'ca':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="8" height="24" fill="#cf3c46" />
          <rect x="8" width="20" height="24" fill="#fff" />
          <rect x="28" width="8" height="24" fill="#cf3c46" />
          <path fill="#cf3c46" d="m18 5 1.4 3.2 3.1-.5-1.9 2.6 2.4 1.5-3 .6.3 3.2-2.3-2-2.3 2 .3-3.2-3-.6 2.4-1.5-1.9-2.6 3.1.5z" />
        </svg>
      )
    case 'nz':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#123b88" />
          <rect width="16" height="10" fill="#203b7a" />
          <path d="M0 0 16 10M16 0 0 10" stroke="#fff" strokeWidth="2.3" />
          <path d="M0 0 16 10M16 0 0 10" stroke="#d8424f" strokeWidth="1.1" />
          <path d="M8 0v10M0 5h16" stroke="#fff" strokeWidth="3.6" />
          <path d="M8 0v10M0 5h16" stroke="#d8424f" strokeWidth="2" />
          <g fill="#d8424f" stroke="#fff" strokeWidth=".6">
            <circle cx="25" cy="7.5" r="1.4" />
            <circle cx="29" cy="11.5" r="1.2" />
            <circle cx="24" cy="15.5" r="1.2" />
            <circle cx="30.5" cy="16.5" r="1" />
          </g>
        </svg>
      )
    case 'sg':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="12" fill="#d73d48" />
          <rect y="12" width="36" height="12" fill="#fff" />
          <circle cx="10" cy="7" r="3.6" fill="#fff" />
          <circle cx="11.5" cy="7" r="2.8" fill="#d73d48" />
          <g fill="#fff">
            <circle cx="14.8" cy="4.4" r=".55" />
            <circle cx="16.2" cy="6.2" r=".55" />
            <circle cx="15.7" cy="8.5" r=".55" />
            <circle cx="13.4" cy="9.4" r=".55" />
            <circle cx="12.3" cy="5.8" r=".55" />
          </g>
        </svg>
      )
    case 'hk':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#d83943" />
          <g fill="#fff">
            <path d="M18 7c2.8 0 3.6 2.4 2.5 4.1C19.1 10.6 18 9 18 7Z" />
            <path d="M23 10c1.4 2.5-.2 4.3-2.1 4.2 1-.8 1.5-2.3 2.1-4.2Z" />
            <path d="M21.5 15c-1 2.8-3.5 2.7-4.9 1.4 1.3 0 2.6-.5 4.9-1.4Z" />
            <path d="M14.5 15c-2.6 1.4-4.4-.3-4.3-2.1.9 1 2.5 1.4 4.3 2.1Z" />
            <path d="M13 10c-2.7-1-2.7-3.4-1.4-4.8.1 1.2.6 2.6 1.4 4.8Z" />
          </g>
        </svg>
      )
    case 'ae':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="9" height="24" fill="#d43a43" />
          <rect x="9" width="27" height="8" fill="#23945c" />
          <rect x="9" y="8" width="27" height="8" fill="#fff" />
          <rect x="9" y="16" width="27" height="8" fill="#12161a" />
        </svg>
      )
    case 'sa':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#167a43" />
          <path d="M8 10h20" stroke="#fff" strokeWidth="1.5" />
          <path d="M12 14h12" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="24.7" cy="14" r=".9" fill="#fff" />
        </svg>
      )
    case 'se':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#1f4fa3" />
          <path d="M11 0v24M0 10h36" stroke="#f2d24b" strokeWidth="5" />
        </svg>
      )
    case 'no':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#cb3b46" />
          <path d="M11 0v24M0 10h36" stroke="#fff" strokeWidth="6" />
          <path d="M11 0v24M0 10h36" stroke="#1f4fa3" strokeWidth="3.2" />
        </svg>
      )
    case 'dk':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#c93644" />
          <path d="M11 0v24M0 10h36" stroke="#fff" strokeWidth="5.5" />
        </svg>
      )
    case 'pl':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="12" fill="#fff" />
          <rect y="12" width="36" height="12" fill="#d84556" />
        </svg>
      )
    case 'cz':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="12" fill="#fff" />
          <rect y="12" width="36" height="12" fill="#d7444d" />
          <path d="M0 0v24l14-12Z" fill="#2451a3" />
        </svg>
      )
    case 'ua':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="12" fill="#2d67c8" />
          <rect y="12" width="36" height="12" fill="#f1c94c" />
        </svg>
      )
    case 'kz':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#37b7d8" />
          <circle cx="18" cy="12" r="4.4" fill="#f5d154" />
          <path d="M5 3v18" stroke="#f5d154" strokeWidth="1.2" />
        </svg>
      )
    case 'th':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="4" fill="#cb3d48" />
          <rect y="4" width="36" height="4" fill="#fff" />
          <rect y="8" width="36" height="8" fill="#254a97" />
          <rect y="16" width="36" height="4" fill="#fff" />
          <rect y="20" width="36" height="4" fill="#cb3d48" />
        </svg>
      )
    case 'vn':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#d9343f" />
          <path
            fill="#f5d154"
            d="m18 5.3 1.6 4.6H24l-3.5 2.5 1.4 4.4-3.9-2.6-3.9 2.6 1.4-4.4-3.5-2.5h4.4z"
          />
        </svg>
      )
    case 'btc':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" rx="4" fill="#f7931a" />
          <circle cx="18" cy="12" r="7" fill="#fff" />
          <text
            x="18"
            y="15.5"
            fill="#f7931a"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontSize="10"
            fontWeight="700"
            textAnchor="middle"
          >
            B
          </text>
          <path d="M15.8 7.7v8.6M20.2 7.7v8.6" stroke="#f7931a" strokeWidth="1" />
        </svg>
      )
    case 'eth':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" rx="4" fill="#151922" />
          <path fill="#9ca7c8" d="m18 4 5.4 8L18 15.2 12.6 12z" />
          <path fill="#6e7aa6" d="m18 16.2 5.4-3.2L18 20 12.6 13z" />
        </svg>
      )
    case 'usdt':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" rx="4" fill="#26a17b" />
          <path
            fill="#fff"
            d="M9 6h18v3h-7v1.8c4.8.2 8 1 8 2 0 1.2-4.3 2.1-10 2.1S8 14 8 12.8c0-1 3.2-1.8 8-2V9H9zm9 6.1c3.5 0 6-.4 6-.8s-2.5-.8-6-.8-6 .4-6 .8 2.5.8 6 .8Z"
          />
        </svg>
      )
    case 'usdc':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" rx="4" fill="#2775ca" />
          <circle cx="18" cy="12" r="7" fill="none" stroke="#fff" strokeWidth="1.4" />
          <text
            x="18"
            y="14.8"
            fill="#fff"
            fontFamily="Inter Tight, Segoe UI, system-ui, sans-serif"
            fontSize="9.5"
            fontWeight="800"
            textAnchor="middle"
          >
            $
          </text>
        </svg>
      )
    default:
      return <FlagMonogram text={code.slice(0, 2)} />
  }
}

function metaForCode(code: string) {
  const cached = resolvedCurrencyMetaCache.get(code)
  if (cached) return cached

  const known = CURRENCY_META[code]
  const resolved = {
    symbol: known?.symbol ?? inferCurrencySymbol(code),
    name: known?.name ?? inferCurrencyName(code),
    flag: known?.flag ?? inferCurrencyFlag(code),
  }
  resolvedCurrencyMetaCache.set(code, resolved)
  return resolved
}

function resolveRuleLabel(
  priced: PricedRates[string] | undefined,
  ruleTitles: ReadonlyMap<number, string>,
  ruleSetTitles: ReadonlyMap<number, string>,
) {
  if (!priced) return 'Нет назначения'

  if (priced.matched) {
    if (priced.ruleId != null) return ruleTitles.get(priced.ruleId) ?? `Правило #${priced.ruleId}`
    if (priced.ruleSetId != null)
      return ruleSetTitles.get(priced.ruleSetId) ?? `Набор #${priced.ruleSetId}`
    return 'Правило применено'
  }

  if (priced.ruleSetId != null) {
    const ruleSetTitle = ruleSetTitles.get(priced.ruleSetId)
    return ruleSetTitle ? `Вне диапазона · ${ruleSetTitle}` : 'Вне диапазона'
  }

  return 'Вне диапазона'
}

export function RatesCard({
  exchanges,
  exchangesLoading,
  onOpenExchangeMenu,
  selectedExchangeId,
  onSelectExchange,
  exchangeTitle,
  rates,
  status,
  series,
  pricedRates,
  rules,
  ruleSets,
  onVisibleChartCodesChange,
}: {
  exchanges: Exchange[]
  exchangesLoading: boolean
  onOpenExchangeMenu: () => void
  selectedExchangeId: string | null
  onSelectExchange: (id: string) => void
  exchangeTitle: string | null
  rates: LiveRates
  status: Status
  series: CurrencyChartSeries
  pricedRates: PricedRates
  rules: Rule[]
  ruleSets: RuleSet[]
  onVisibleChartCodesChange: (codes: string[]) => void
}) {
  const ruleTitles = useMemo(
    () => new Map(rules.map((rule) => [rule.id, rule.title] as const)),
    [rules],
  )
  const ruleSetTitles = useMemo(
    () => new Map(ruleSets.map((ruleSet) => [ruleSet.id, ruleSet.title] as const)),
    [ruleSets],
  )
  const entries = useMemo(
    () =>
      Object.entries(rates)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([code, rawValue]) => {
          const priced = pricedRates[code]
          return {
            code,
            rawValue,
            priced,
            meta: metaForCode(code),
            ruleLabel: resolveRuleLabel(priced, ruleTitles, ruleSetTitles),
          }
        }),
    [pricedRates, rates, ruleSetTitles, ruleTitles],
  )
  const entryCodes = useMemo(() => entries.map(({ code }) => code), [entries])
  const entryCodesKey = entryCodes.join('|')

  const supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined'
  const [visibleChartCodes, setVisibleChartCodes] = useState<string[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const chartNodesRef = useRef(new Map<string, HTMLElement>())
  const visibleCodesRef = useRef(new Set<string>())
  const refCallbacksRef = useRef(new Map<string, (node: HTMLElement | null) => void>())

  function getBindChartNode(code: string) {
    let cb = refCallbacksRef.current.get(code)
    if (cb) return cb
    cb = (node: HTMLElement | null) => {
      const prev = chartNodesRef.current.get(code)
      const observer = observerRef.current
      if (prev && observer) observer.unobserve(prev)
      if (node) {
        chartNodesRef.current.set(code, node)
        if (observer) observer.observe(node)
      } else {
        chartNodesRef.current.delete(code)
        if (visibleCodesRef.current.delete(code)) {
          setVisibleChartCodes(Array.from(visibleCodesRef.current))
        }
      }
    }
    refCallbacksRef.current.set(code, cb)
    return cb
  }

  useEffect(() => {
    if (!supportsIntersectionObserver) return

    const observer = new IntersectionObserver(
      (observerEntries) => {
        let changed = false
        for (const observerEntry of observerEntries) {
          const code = observerEntry.target.getAttribute('data-currency-code')
          if (!code) continue
          if (observerEntry.isIntersecting) {
            if (!visibleCodesRef.current.has(code)) {
              visibleCodesRef.current.add(code)
              changed = true
            }
          } else if (visibleCodesRef.current.delete(code)) {
            changed = true
          }
        }
        if (changed) setVisibleChartCodes(Array.from(visibleCodesRef.current))
      },
      { threshold: CHART_VISIBILITY_THRESHOLD },
    )
    observerRef.current = observer

    for (const node of chartNodesRef.current.values()) {
      observer.observe(node)
    }

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [supportsIntersectionObserver])

  // Prune visibility state when the set of currencies changes.
  useEffect(() => {
    const currentCodes = new Set(entryCodes)
    let changed = false
    for (const code of Array.from(visibleCodesRef.current)) {
      if (!currentCodes.has(code)) {
        visibleCodesRef.current.delete(code)
        changed = true
      }
    }
    if (changed) setVisibleChartCodes(Array.from(visibleCodesRef.current))
    // entryCodes identity changes every render; depend on a stable key.
  }, [entryCodesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveVisibleChartCodes = supportsIntersectionObserver
    ? visibleChartCodes
    : entryCodes
  const visibleCodesSet = useMemo(
    () => new Set(effectiveVisibleChartCodes),
    [effectiveVisibleChartCodes],
  )

  useEffect(() => {
    onVisibleChartCodesChange(effectiveVisibleChartCodes)
  }, [effectiveVisibleChartCodes, onVisibleChartCodesChange])

  return (
    <>
      <section className="rates-table" aria-labelledby="dashboardTitle">
        <h1 id="dashboardTitle" className="sr-only">
          Таблица курсов
        </h1>
        <div className="table-head">
          <span>Валюта (за единицу)</span>
          <span>RUB</span>
          <span>Правила</span>
          <span>Наценка</span>
          <span>Расчёт</span>
        </div>
        <div className="table-body">
          {entries.length === 0 ? (
            <div className="rate-row">
              <span className="currency-cell text-slate-300">Ожидаем котировки по выбранной бирже</span>
              <span className="rub-cell">—</span>
              <span className="formula-cell">{statusText(status)}</span>
              <span className="markup-cell">—</span>
              <span className="result-cell">—</span>
            </div>
          ) : (
            entries.map(({ code, rawValue, priced, meta, ruleLabel }) => (
              <div key={code} className="rate-row">
                <span className="currency-cell">
                  <span className="currency-flag" aria-hidden="true">
                    <CurrencyFlag code={code} flag={meta.flag} />
                  </span>
                  <CurrencySymbolIcon code={code} symbol={meta.symbol} />
                  <span className="currency-code">
                    {code}
                    <small>{meta.name}</small>
                  </span>
                </span>
                <span className="rub-cell">{formatDecimal(rawValue)}</span>
                <span className="formula-cell" title={ruleLabel}>
                  {ruleLabel}
                </span>
                <span className="markup-cell">
                  {priced ? formatDecimal(priced.markup) : '—'}
                </span>
                <span className="result-cell">
                  {priced ? formatDecimal(priced.final) : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="chart-panel" aria-label="Изображение графика">
        <div className="panel-title">
          <h2>Графики валют</h2>
          <DropdownMenu onOpenChange={(open) => open && onOpenExchangeMenu()}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Выбрать биржу"
                className="group h-9 max-w-[16rem] gap-1.5 rounded-lg border border-[rgba(179,231,209,0.28)] bg-[#081112] px-3 text-xs text-slate-100 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] hover:border-[rgba(179,231,209,0.45)] hover:bg-[#0b1717] data-[state=open]:border-[rgba(179,231,209,0.6)] data-[state=open]:bg-[#0b1717]"
              >
                <span className="truncate text-slate-100">
                  {exchangesLoading ? 'Обновляем…' : exchangeTitle ?? 'Выбрать биржу'}
                </span>
                <ChevronDownIcon
                  className="size-3.5 shrink-0 text-slate-300 transition-transform duration-150 group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-xl border border-[rgba(158,231,159,0.22)] bg-[#0a1515] text-white"
            >
              {exchanges.length === 0 ? (
                <DropdownMenuItem disabled>Биржи пока не подключены</DropdownMenuItem>
              ) : (
                exchanges.map((exchange) => {
                  const isActive = selectedExchangeId === exchange.id
                  return (
                    <DropdownMenuItem
                      key={exchange.id}
                      onSelect={() => onSelectExchange(exchange.id)}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className={isActive ? 'font-medium text-cyan-200' : undefined}>
                        {exchange.title}
                      </span>
                      {isActive ? (
                        <CheckIcon className="size-3.5 text-cyan-300" aria-hidden="true" />
                      ) : null}
                    </DropdownMenuItem>
                  )
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="spark-list">
          {entries.length === 0 ? (
            <article className="spark-card">
              <div className="spark-hover-layer" aria-hidden="true" />
              <svg viewBox="0 0 230 64" role="img" aria-label="График отсутствует">
                <path className="spark-grid" d="M0 13H230M0 32H230M0 51H230" />
              </svg>
              <span className="spark-value">
                Нет данных
                <small>Подключите биржу</small>
              </span>
            </article>
          ) : (
            entries.map(({ code, priced }) => (
              <article
                key={code}
                ref={getBindChartNode(code)}
                data-currency-code={code}
                className="spark-card"
              >
                <span className="spark-hover-layer" aria-hidden="true" />
                <div className="h-[52px] w-full">
                  <CurrencyLineChart
                    points={series[code]}
                    isVisible={visibleCodesSet.has(code)}
                  />
                </div>
                <span className="spark-value">
                  {priced ? formatDecimal(priced.final) : '—'}
                  <small>{code}</small>
                </span>
              </article>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
