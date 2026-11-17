import React from 'react'
import {
  Plus, Bell, Zap, Wifi, Smartphone, Home, HandCoins, CreditCard,
  ReceiptText, CalendarDays, Check, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { Card, SectionHeader, Pill, Segmented, EmptyState } from '../components/UI'
import { formatDate, formatMoney, daysBetween } from '../utils'
import { TODAY } from '../data'

const KIND_ICONS = {
  zap: Zap, wifi: Wifi, smartphone: Smartphone, home: Home,
  'hand-coins': HandCoins, 'credit-card': CreditCard, receipt: ReceiptText,
}

export default function Bills({ t, lang, displayCurrency, rate, bills, reminders, cv, onPayBill, onOpenModal }) {
  const [tab, setTab] = React.useState('bill')
  const money = (amount, cur) => formatMoney(cv(amount, cur, displayCurrency, rate), displayCurrency, lang)

  const list = React.useMemo(
    () => bills.filter((b) => b.kind === tab).sort((a, b) => {
      if (a.status !== b.status) return a.status === 'unpaid' ? -1 : 1
      return a.dueDate < b.dueDate ? -1 : 1
    }),
    [bills, tab],
  )

  const stats = React.useMemo(() => {
    const unpaid = bills.filter((b) => b.status === 'unpaid')
    const outstanding = unpaid.reduce((s, b) => s + cv(b.amount, b.currency, displayCurrency, rate), 0)
    const overdue = unpaid.filter((b) => daysBetween(b.dueDate, TODAY) < 0).length
    return { count: unpaid.length, outstanding, overdue }
  }, [bills, displayCurrency, rate, cv])

  const dueText = (date) => {
    const d = daysBetween(date, TODAY)
    if (d < 0) return { text: t('bills.overdueBy', { days: Math.abs(d) }), tone: 'bad' }
    if (d === 0) return { text: t('bills.dueToday'), tone: 'warn' }
    if (d === 1) return { text: t('bills.dueTomorrow'), tone: 'warn' }
    if (d <= 4) return { text: t('bills.dueIn', { days: d }), tone: 'warn' }
    return { text: formatDate(date, lang, true), tone: 'neutral' }
  }

  const tabOptions = [
    { value: 'bill', label: `${t('bills.tabBills')} (${bills.filter((b) => b.kind === 'bill').length})` },
    { value: 'debt', label: `${t('bills.tabDebts')} (${bills.filter((b) => b.kind === 'debt').length})` },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('bills.title')}</h1>
          <p>{t('bills.subtitle')}</p>
        </div>
        <div className="head-actions">
          <button className="btn ghost" onClick={() => onOpenModal('debt')}><HandCoins size={16} /> {t('actions.addDebt')}</button>
          <button className="btn primary" onClick={() => onOpenModal('bill')}><Plus size={17} /> {t('actions.addBill')}</button>
        </div>
      </div>

      <div className="stat-row">
        <Card className="stat-card feature">
          <span className="stat-label">{t('bills.totalOutstanding')}</span>
          <strong className="stat-value num">{formatMoney(stats.outstanding, displayCurrency, lang)}</strong>
          <span className="stat-foot">{stats.count} {t('bills.unpaid')}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">{t('bills.dueSoon')}</span>
          <strong className="stat-value num">{reminders.length}</strong>
          <span className="stat-foot"><Bell size={13} /> {t('bills.notificationsOn')}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">{t('bills.overdue')}</span>
          <strong className="stat-value num">{stats.overdue}</strong>
          <span className="stat-foot"><AlertTriangle size={13} /> {t('misc.overdue')}</span>
        </Card>
      </div>

      {reminders.length > 0 && (
        <div className="notice-banner">
          <span className="notice-icon"><Bell size={18} /></span>
          <div>
            <strong>{t('bills.reminderTitle')}</strong>
            <span>{t('bills.reminderText', { count: reminders.length })}</span>
          </div>
          <Pill tone="gold">{formatDate(TODAY, lang, true)}</Pill>
        </div>
      )}

      <Card className="bills-card">
        <div className="bills-head">
          <Segmented options={tabOptions} value={tab} onChange={setTab} />
          <span className="bills-hint"><RefreshCw size={13} /> {t('bills.recurringLabel')}</span>
        </div>

        {list.length === 0 ? <EmptyState text={t('bills.empty')} /> : (
          <div className="bill-list">
            {list.map((b) => {
              const Icon = KIND_ICONS[b.icon] || ReceiptText
              const due = dueText(b.dueDate)
              const paid = b.status === 'paid'
              return (
                <div key={b.id} className={`bill-row ${paid ? 'paid' : ''}`}>
                  <span className={`bill-icon ${paid ? 'is-paid' : ''}`}><Icon size={20} strokeWidth={1.9} /></span>
                  <div className="bill-info">
                    <div className="bill-name-line">
                      <strong>{lang === 'ar' ? b.name : (b.nameEn || b.name)}</strong>
                      {b.recurring && <Pill tone="neutral" icon={RefreshCw}>{t('bills.recurring')}</Pill>}
                    </div>
                    <div className="bill-meta">
                      <span><CalendarDays size={13} /> {formatDate(b.dueDate, lang, true)}</span>
                      <span className={`due-${due.tone}`}>{paid ? t('bills.paid') : due.text}</span>
                      {b.paidDate && <span className="paid-date"><Check size={13} /> {formatDate(b.paidDate, lang)}</span>}
                    </div>
                  </div>
                  <div className="bill-amount">
                    <strong className="num">{money(b.amount, b.currency)}</strong>
                    <span>{b.currency}</span>
                  </div>
                  {paid ? (
                    <Pill tone="mint" icon={Check}>{t('bills.paid')}</Pill>
                  ) : (
                    <button className="btn primary small" onClick={() => onPayBill(b.id)}>{t('bills.payNow')}</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
