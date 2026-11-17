import React from 'react'
import {
  Plus, ArrowUpRight, ArrowDownRight, Wallet, TrendingDown, PiggyBank,
  ReceiptText, CalendarDays, Zap, Wifi, Smartphone, Home, HandCoins,
  CreditCard, Bell, ChevronLeft, Check, Pencil,
} from 'lucide-react'
import { Card, SectionHeader, Pill, ProgressBar, ProgressRing, EmptyState } from '../components/UI'
import { DonutChart, Sparkline } from '../components/Charts'
import { colorForLabel, formatDate, formatMoney, daysBetween, convert, groupByDate } from '../utils'
import { TODAY } from '../data'

const BILL_ICONS = { zap: Zap, wifi: Wifi, smartphone: Smartphone, home: Home, 'hand-coins': HandCoins, 'credit-card': CreditCard, receipt: ReceiptText }

export default function Overview({
  t, lang, displayCurrency, rate, totals, walletStats, cycle, cycleTransactions,
  goals, generalSavings, bills, reminders, convert: cv, onNavigate, onOpenModal, onPayBill,
}) {
  const money = (amount, cur = 'SYP', frac = 0) => formatMoney(cv(amount, cur, displayCurrency, rate), displayCurrency, lang, frac)

  // مخطط دونات حسب المنفق عليه
  const donutData = React.useMemo(() => {
    const map = {}
    cycleTransactions.filter((x) => x.type === 'expense').forEach((x) => {
      const key = lang === 'ar' ? x.label : (x.labelEn || x.label)
      map[key] = (map[key] || 0) + cv(x.amount, x.currency, displayCurrency, rate)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value, color: colorForLabel(name) }))
  }, [cycleTransactions, lang, displayCurrency, rate, cv])

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  // آخر الحركات
  const recent = React.useMemo(
    () => [...cycleTransactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5),
    [cycleTransactions],
  )

  // فواتير قادمة
  const upcoming = React.useMemo(
    () => bills.filter((b) => b.status === 'unpaid').sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).slice(0, 3),
    [bills],
  )

  // قيم السبارك لاون لآخر 7 أيام
  const sparkValues = React.useMemo(() => {
    const days = []
    const today = new Date(TODAY)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return days.map((day) => cycleTransactions
      .filter((x) => x.type === 'expense' && x.date === day)
      .reduce((s, x) => s + cv(x.amount, x.currency, displayCurrency, rate), 0))
  }, [cycleTransactions, displayCurrency, rate, cv])

  const dueText = (date) => {
    const d = daysBetween(date, TODAY)
    if (d < 0) return t('bills.overdueBy', { days: Math.abs(d) })
    if (d === 0) return t('bills.dueToday')
    if (d === 1) return t('bills.dueTomorrow')
    return t('bills.dueIn', { days: d })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('nav.overview')}</h1>
          <p>{t('header.cycle', { start: formatDate(cycle.start, lang), end: formatDate(cycle.end, lang) })}</p>
        </div>
        <div className="page-head-actions">
          <button className="btn ghost" onClick={() => onOpenModal('income')}>
            <ArrowDownRight size={17} /> {t('actions.addIncome')}
          </button>
          <button className="btn primary" onClick={() => onOpenModal('expense')}>
            <Plus size={17} /> {t('actions.addExpense')}
          </button>
        </div>
      </div>

      <div className="grid">
        {/* HERO */}
        <Card className="hero col-8">
          <div className="hero-pattern" />
          <div className="hero-top">
            <span className="hero-stamp">
              <CalendarDays size={13} /> {t('misc.month')} · {formatDate(TODAY, lang)}
            </span>
            <span className="hero-rate">{t('misc.rateNote', { rate: new Intl.NumberFormat('en-US').format(rate) })}</span>
          </div>
          <div className="hero-main">
            <div>
              <span className="hero-label">{t('overview.remaining')}</span>
              <div className="hero-amount num">{formatMoney(totals.remaining, displayCurrency, lang)}</div>
              <div className="hero-sub">{t('overview.ofTotal', { total: formatMoney(totals.totalAvailable, displayCurrency, lang) })}</div>
            </div>
            <div className="hero-spark"><Sparkline values={sparkValues} /></div>
          </div>
          <div className="hero-stats">
            <div><span>{t('overview.available')}</span><strong className="num">{formatMoney(totals.spendable, displayCurrency, lang)}</strong></div>
            <div><span>{t('overview.spent')}</span><strong className="num">{formatMoney(totals.spent, displayCurrency, lang)}</strong></div>
            <div><span>{t('overview.savingsThisMonth')}</span><strong className="num">{formatMoney(totals.savingsMonth, displayCurrency, lang)}</strong></div>
          </div>
        </Card>

        {/* بطاقات المحافظ */}
        {['SYP', 'USD'].map((cur) => {
          const s = walletStats[cur]
          return (
            <Card key={cur} className={`wallet-card col-4 ${cur === 'SYP' ? 'wallet-syp' : 'wallet-usd'}`}>
              <div className="wallet-card-top">
                <span className="wallet-icon"><Wallet size={17} /></span>
                <span className="wallet-name">{cur === 'SYP' ? t('currency.nameSYP') : t('currency.nameUSD')}</span>
                <Pill tone={cur === 'SYP' ? 'mint' : 'gold'}>{cur}</Pill>
                <button className="wallet-edit" onClick={() => onOpenModal('wallet', { currency: cur, base: s.base, carry: s.carry })} aria-label={t('actions.edit')}>
                  <Pencil size={13} />
                </button>
              </div>
              <div className="wallet-balance-label">{t('overview.walletBalance')}</div>
              <div className="wallet-balance num">{money(s.remaining, cur)}</div>
              <div className="wallet-meter">
                <div className="wallet-meter-row"><span>{t('overview.available')}</span><b className="num">{money(s.spendable, cur)}</b></div>
                <ProgressBar
                  value={Math.max(0, s.remaining)} max={Math.max(1, s.spendable)}
                  color={cur === 'SYP' ? 'var(--mint)' : 'var(--gold)'} height={6}
                />
              </div>
              <div className="wallet-mini-stats">
                <span>{t('overview.baseAmount')} <b className="num">{money(s.base, cur)}</b></span>
                <span>{t('overview.extraIncome')} <b className="num">{money(s.extra, cur)}</b></span>
              </div>
            </Card>
          )
        })}

        {/* توزيع المصاريف */}
        <Card className="col-5">
          <SectionHeader title={t('overview.spendingBreakdown')} icon={TrendingDown} />
          {donutData.length ? (
            <>
              <DonutChart data={donutData} total={donutTotal} currency={displayCurrency} lang={lang} t={t} />
              <div className="legend">
                {donutData.map((d) => (
                  <div key={d.name} className="legend-row">
                    <span className="legend-dot" style={{ background: d.color }} />
                    <span className="legend-name">{d.name}</span>
                    <span className="legend-val num">{formatMoney(d.value, displayCurrency, lang)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState text={t('overview.noData')} />}
        </Card>

        {/* فواتير قادمة */}
        <Card className="col-7">
          <SectionHeader title={t('overview.upcomingBills')} icon={ReceiptText} action={t('actions.viewAll')} onAction={() => onNavigate('bills')} />
          {reminders.length > 0 && (
            <div className="reminder-strip">
              <Bell size={15} />
              <span>{t('bills.reminderText', { count: reminders.length })}</span>
            </div>
          )}
          <div className="bill-mini-list">
            {upcoming.length === 0 && <EmptyState text={t('bills.empty')} />}
            {upcoming.map((b) => {
              const Icon = BILL_ICONS[b.icon] || ReceiptText
              const days = daysBetween(b.dueDate, TODAY)
              return (
                <div key={b.id} className="bill-mini-row">
                  <span className={`bill-mini-icon ${days < 0 ? 'late' : ''}`}><Icon size={16} /></span>
                  <div className="bill-mini-info">
                    <strong>{lang === 'ar' ? b.name : (b.nameEn || b.name)}</strong>
                    <span className={days < 0 ? 'late-text' : ''}>{dueText(b.dueDate)}</span>
                  </div>
                  <span className="bill-mini-amount num">{money(b.amount, b.currency)}</span>
                  <button className="btn tiny" onClick={() => onPayBill(b.id)}>{t('actions.pay')}</button>
                </div>
              )
            })}
          </div>
        </Card>

        {/* أهداف الادخار */}
        <Card className="col-7">
          <SectionHeader title={t('overview.goals')} icon={PiggyBank} action={t('actions.viewAll')} onAction={() => onNavigate('savings')} />
          <div className="goal-mini-grid">
            {goals.length === 0 && <EmptyState text={t('savings.empty')} />}
            {goals.slice(0, 2).map((g) => {
              const pct = g.target ? Math.min(100, (g.saved / g.target) * 100) : 0
              return (
                <div key={g.id} className="goal-mini">
                  <ProgressRing value={g.saved} max={g.target} size={56} stroke={6} />
                  <div className="goal-mini-body">
                    <strong>{lang === 'ar' ? g.name : (g.nameEn || g.name)}</strong>
                    <div className="goal-mini-nums num">
                      {money(g.saved, g.currency)} <span>/ {money(g.target, g.currency)}</span>
                    </div>
                    <ProgressBar value={g.saved} max={g.target} color="var(--gold)" height={5} />
                  </div>
                  <span className="goal-pct num">{Math.round(pct)}%</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* آخر الحركات */}
        <Card className="col-5">
          <SectionHeader title={t('overview.recent')} icon={ArrowUpRight} action={t('actions.viewAll')} onAction={() => onNavigate('expenses')} />
          <div className="tx-list compact">
            {recent.length === 0 && <EmptyState text={t('overview.noData')} />}
            {recent.map((x) => {
              const isIncome = x.type === 'income'
              const isSaving = x.type === 'savings'
              const Icon = isIncome ? ArrowDownRight : isSaving ? PiggyBank : ArrowUpRight
              return (
                <div key={x.id} className="tx-row">
                  <span className="tx-dot" style={{ background: colorForLabel(x.label) }}><Icon size={13} /></span>
                  <div className="tx-info">
                    <strong>{lang === 'ar' ? x.label : (x.labelEn || x.label)}</strong>
                    <span>{formatDate(x.date, lang)} · {x.currency}</span>
                  </div>
                  <span className={`tx-amount num ${isIncome ? 'positive' : ''}`}>
                    {isIncome ? '+' : ''}{money(x.amount, x.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
