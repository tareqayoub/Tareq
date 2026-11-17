import React from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { formatMoney } from '../utils'

function CustomTooltip({ active, payload, label, currency, lang, t, isMoney = true }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      <div className="chart-tooltip-value">
        {isMoney ? formatMoney(item.value, currency, lang, currency === 'USD' ? 2 : 0) : item.value}
      </div>
      {item.name && <div className="chart-tooltip-name">{item.name}</div>}
    </div>
  )
}

export function DonutChart({ data, total, currency, lang, t }) {
  return (
    <div className="donut-wrap" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="92%"
            paddingAngle={2} stroke="none" isAnimationActive
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} lang={lang} t={t} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <span className="donut-center-label">{t('misc.total')}</span>
        <strong className="num">{formatMoney(total, currency, lang)}</strong>
      </div>
    </div>
  )
}

export function SpendChart({ data, currency, lang, t }) {
  return (
    <div className="spend-chart" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 6" opacity={0.7} />
          <XAxis
            dataKey="label" tickLine={false} axisLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'Space Grotesk' }}
            dy={8}
          />
          <YAxis
            tickLine={false} axisLine={false} width={48}
            tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'Space Grotesk' }}
            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v}
          />
          <Tooltip content={<CustomTooltip currency={currency} lang={lang} t={t} />} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar dataKey="value" name={t('overview.spent')} fill="var(--forest)" radius={[6, 6, 2, 2]} maxBarSize={34} isAnimationActive />
          <Line
            dataKey="average" name={t('misc.average')} stroke="var(--gold)" strokeWidth={2}
            dot={false} strokeDasharray="5 5" isAnimationActive
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Sparkline({ values = [], color = '#b9e3d0' }) {
  if (!values.length) return null
  const w = 180, h = 48
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w
    const y = h - 4 - ((v - min) / range) * (h - 10)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={pts.split(' ').at(-1).split(',')[1]} r="3" fill={color} />
    </svg>
  )
}
