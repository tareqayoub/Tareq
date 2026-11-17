import React from 'react'
import { Plus, ArrowUpRight, Search, SlidersHorizontal, CalendarDays, TrendingUp } from 'lucide-react'
import { Card, SectionHeader, Segmented, EmptyState, Pill } from '../components/UI'
import { SpendChart } from '../components/Charts'
import { formatMoney, formatDate, colorForLabel, daysBetween, groupByDate, convert } from '../utils'
import { TODAY, monthlyHistory, yearlyHistory } from '../data'

export default function Expenses({ t, lang, displayCurrency, rate, cycle, cycleTransactions, cv, onOpenModal }) {
  const [period, setPeriod] = React.useState('daily')
  const [filter, setFilter] = React.useState('all')
  const [query, setQuery] = React.useState('')

  const money = (amount, cur, frac = 0) => formatMoney(cv(amount, cur, displayCurrency, rate), displayCurrency, lang, frac)

  const expenses = React.useMemo(() => cycleTransactions.filter((x) => x.type === 'expense'), [cycleTransactions])

  const totalSpent = React.useMemo(
    () => expenses.reduce((s, x) => s + cv(x.amount, x.currency, displayCurrency, rate), 0),
    [expenses, displayCurrency, rate, cv],
  )

  const daysElapsed = Math.max(1, daysBetween(TODAY, cycle.start) + 1)
  const dailyAverage = totalSpent / daysElapsed

  const biggest = React.useMemo(() => {
    const map = {}
    expenses.forEach((x) => {
      const key = lang === 'ar' ? x.label : (x.labelEn || x.label)
      map[key] = (map[key] || 0) + cv(x.amount, x.currency, displayCurrency, rate)
    })
    const entry = Object.entries(map).sort((a, b) => b[1] - a[1])[0]
    return entry ? { name: entry[0], value: entry[1] } : null
  }, [expenses, lang, displayCurrency, rate, cv])

  const chartData = React.useMemo(() => {
    const toDisplay = (items) => items.reduce((s, x) => s + cv(x.amount, x.currency, displayCurrency, rate), 0)
    if (period === 'daily') {
      const today = new Date(TODAY)
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (6 - i))
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const items = expenses.filter((x) => x.date === key)
        return {
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          value: toDisplay(items),
        }
      })
    }
    if (period === 'weekly') {
      return Array.from({ length: 4 }, (_, i) => {
        const items = expenses.filter((x) => {
          const diff = daysBetween(x.date, cycle.start)
          return diff >= i * 7 && diff < (i + 1) * 7
        })
        return { label: `${lang === 'ar' ? 'أسبوع' : 'W'} ${i + 1}`, value: toDisplay(items) }
      })
    }
    if (period === 'monthly') {
      const current = { key: 'current', labelAr: 'تشرين الثاني', labelEn: 'Nov', value: toDisplay(expenses) }
      return [...monthlyHistory, current].map((m) => ({
        label: lang === 'ar' ? m.labelAr : m.labelEn,
        value: cv(m.value, 'SYP', displayCurrency, rate),
      }))
    }
    const currentYear = {
      key: '2026', labelAr: '2026', labelEn: '2026',
      value: toDisplay(expenses) + 37200000, // بقية أشهر السنة للعرض التجريبي
    }
    return [...yearlyHistory, currentYear].map((m) => ({
      label: lang === 'ar' ? m.labelAr : m.labelEn,
      value: cv(m.value, 'SYP', displayCurrency, rate),
    }))
  }, [period, expenses, cycle, displayCurrency, rate, cv, lang])

  const chartWithAvg = React.useMemo(() => {
    const avg = chartData.reduce((s, d) => s + d.value, 0) / Math.max(1, chartData.length)
    return chartData.map((d) => ({ ...d, average: avg }))
  }, [chartData])

  const filtered = React.useMemo(() => {
    let list = expenses
    if (filter !== 'all') list = list.filter((x) => x.currency === filter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((x) => `${x.label} ${x.labelEn || ''}`.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [expenses, filter, query])

  const grouped = React.useMemo(() => groupByDate(filtered), [filtered])

  const periodOptions = [
    { value: 'daily', label: t('expenses.periodDaily') },
    { value: 'weekly', label: t('expenses.periodWeekly') },
    { value: 'monthly', label: t('expenses.periodMonthly') },
    { value: 'yearly', label: t('expenses.periodYearly') },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('expenses.title')}</h1>
          <p>{t('expenses.subtitle')}</p>
        </div>
        <button className="btn primary" onClick={() => onOpenModal('expense')}><Plus size={17} /> {t('actions.addExpense')}</button>
      </div>

      <div className="stat-row">
        <Card className="stat-card">
          <span className="stat-label">{t('expenses.total')}</span>
          <strong className="stat-value num">{formatMoney(totalSpent, displayCurrency, lang)}</strong>
          <span className="stat-foot">{t('misc.month')} · {formatDate(cycle.start, lang)}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">{t('expenses.average')}</span>
          <strong className="stat-value num">{formatMoney(dailyAverage, displayCurrency, lang)}</strong>
          <span className="stat-foot">{t('misc.days')} · {daysElapsed}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">{t('expenses.biggest')}</span>
          <strong className="stat-value stat-text">{biggest ? biggest.name : '—'}</strong>
          <span className="stat-foot num">{biggest ? formatMoney(biggest.value, displayCurrency, lang) : '—'}</span>
        </Card>
      </div>

      <Card className="chart-card">
        <div className="chart-head">
          <div>
            <h3>{t('expenses.chartTitle')}</h3>
            <p><TrendingUp size={13} /> {t('misc.average')} · <span className="num">{formatMoney(dailyAverage, displayCurrency, lang)}</span></p>
          </div>
          <Segmented options={periodOptions} value={period} onChange={setPeriod} />
        </div>
        <SpendChart data={chartWithAvg} currency={displayCurrency} lang={lang} t={t} />
      </Card>

      <Card className="list-card">
        <div className="list-head">
          <SectionHeader title={t('expenses.listTitle')} icon={CalendarDays} />
          <div className="list-tools">
            <div className="search-box">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('modal.descriptionPlaceholder')} />
            </div>
            <div className="filter-chips">
              {['all', 'SYP', 'USD'].map((f) => (
                <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                  {f === 'all' ? t('expenses.filterAll') : f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="list-count">{t('misc.showing', { count: filtered.length })}</div>
        {filtered.length === 0 ? <EmptyState text={t('expenses.empty')} /> : (
          <div className="tx-groups">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="tx-group">
                <div className="tx-date">{formatDate(date, lang, true)}</div>
                {items.map((x) => (
                  <div key={x.id} className="tx-row">
                    <span className="tx-dot" style={{ background: colorForLabel(x.label) }}><ArrowUpRight size={13} /></span>
                    <div className="tx-info">
                      <strong>{lang === 'ar' ? x.label : (x.labelEn || x.label)}</strong>
                      <span>{x.currency} · {formatDate(x.date, lang)}</span>
                    </div>
                    <span className="tx-amount num negative">−{money(x.amount, x.currency)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
