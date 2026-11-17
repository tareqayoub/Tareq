import React from 'react'
import {
  Plus, PiggyBank, Wallet, ArrowDownRight, ArrowUpRight, Target,
  Laptop, Plane, Shield, Sparkles, History,
} from 'lucide-react'
import { Card, SectionHeader, Pill, ProgressBar, ProgressRing, EmptyState } from '../components/UI'
import { formatDate, formatMoney, colorForLabel } from '../utils'

const GOAL_ICONS = { laptop: Laptop, plane: Plane, shield: Shield, target: Target }

export default function Savings({
  t, lang, displayCurrency, rate, goals, generalSavings, savingsHistory, cv, onOpenModal,
}) {
  const money = (amount, cur, frac = 0) => formatMoney(cv(amount, cur, displayCurrency, rate), displayCurrency, lang, frac)

  const totals = React.useMemo(() => {
    const general = ['SYP', 'USD'].reduce((s, cur) => s + cv(generalSavings[cur] || 0, cur, displayCurrency, rate), 0)
    const inGoals = goals.reduce((s, g) => s + cv(g.saved, g.currency, displayCurrency, rate), 0)
    return { general, inGoals, all: general + inGoals }
  }, [generalSavings, goals, displayCurrency, rate, cv])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('savings.title')}</h1>
          <p>{t('savings.subtitle')}</p>
        </div>
        <div className="head-actions">
          <button className="btn ghost" onClick={() => onOpenModal('withdraw')}><ArrowUpRight size={16} /> {t('actions.withdraw')}</button>
          <button className="btn primary" onClick={() => onOpenModal('deposit')}><Plus size={17} /> {t('actions.addDeposit')}</button>
        </div>
      </div>

      <div className="stat-row">
        <Card className="stat-card feature">
          <span className="stat-label">{t('savings.total')}</span>
          <strong className="stat-value num">{formatMoney(totals.all, displayCurrency, lang)}</strong>
          <span className="stat-foot"><Sparkles size={13} /> {t('savings.goals')} + {t('savings.general')}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">{t('savings.general')}</span>
          <strong className="stat-value num">{formatMoney(totals.general, displayCurrency, lang)}</strong>
          <div className="dual-balance">
            <span className="num">{formatMoney(generalSavings.SYP, 'SYP', lang)}</span>
            <span className="num">{formatMoney(generalSavings.USD, 'USD', lang, 2)}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <span className="stat-label">{t('savings.goals')}</span>
          <strong className="stat-value num">{formatMoney(totals.inGoals, displayCurrency, lang)}</strong>
          <span className="stat-foot">{goals.length} {t('savings.goals')}</span>
        </Card>
      </div>

      <Card className="goals-card">
        <SectionHeader
          title={t('savings.goals')}
          icon={Target}
          action={t('actions.addGoal')}
          onAction={() => onOpenModal('goal')}
        />
        {goals.length === 0 ? <EmptyState text={t('savings.empty')} /> : (
          <div className="goals-grid">
            {goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0
              const Icon = GOAL_ICONS[g.icon] || Target
              const complete = pct >= 100
              return (
                <div key={g.id} className={`goal-card ${complete ? 'complete' : ''}`}>
                  <div className="goal-card-top">
                    <span className="goal-icon"><Icon size={20} strokeWidth={1.9} /></span>
                    {complete && <Pill tone="mint" icon={Sparkles}>{t('savings.completed')}</Pill>}
                  </div>
                  <div className="goal-title">{lang === 'ar' ? g.name : (g.nameEn || g.name)}</div>
                  <div className="goal-amounts">
                    <strong className="num">{money(g.saved, g.currency)}</strong>
                    <span className="num">{t('savings.target')} · {money(g.target, g.currency)}</span>
                  </div>
                  <div className="goal-ring-row">
                    <ProgressRing value={g.saved} max={g.target} size={64} stroke={7} color={complete ? 'var(--mint)' : 'var(--gold)'} />
                    <div className="goal-progress-info">
                      <span className="goal-pct num">{Math.round(pct)}%</span>
                      <span className="goal-remaining num">{t('savings.remainingToGoal', { amount: money(Math.max(0, g.target - g.saved), g.currency) })}</span>
                    </div>
                  </div>
                  <ProgressBar value={g.saved} max={g.target} color={complete ? 'var(--mint)' : 'var(--gold)'} height={7} />
                  <button className="btn soft full" onClick={() => onOpenModal('deposit', { goalId: g.id, currency: g.currency })}>
                    <Plus size={15} /> {t('actions.addDeposit')}
                  </button>
                </div>
              )
            })}
            <button className="goal-add" onClick={() => onOpenModal('goal')}>
              <span><Plus size={22} /></span>
              <strong>{t('actions.addGoal')}</strong>
            </button>
          </div>
        )}
      </Card>

      <Card className="history-card">
        <SectionHeader title={t('savings.history')} icon={History} />
        {savingsHistory.length === 0 ? <EmptyState text={t('savings.empty')} /> : (
          <div className="tx-list">
            {savingsHistory.map((x) => {
              const isWithdraw = x.source === 'withdrawal'
              const Icon = isWithdraw ? ArrowUpRight : ArrowDownRight
              return (
                <div key={x.id} className="tx-row">
                  <span className="tx-dot" style={{ background: isWithdraw ? 'var(--clay)' : 'var(--mint)' }}><Icon size={13} /></span>
                  <div className="tx-info">
                    <strong>{x.label || (lang === 'ar' ? t('savings.general') : t('savings.general'))}</strong>
                    <span>{formatDate(x.date, lang, true)} · {x.currency}</span>
                  </div>
                  <span className={`tx-amount num ${isWithdraw ? 'negative' : 'positive'}`}>
                    {isWithdraw ? '−' : '+'}{money(x.amount, x.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
