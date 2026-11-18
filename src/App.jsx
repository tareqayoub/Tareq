import React from 'react'
import {
  LayoutDashboard, ReceiptText, PiggyBank, CalendarDays, Bell,
  Sun, Moon, Languages, RotateCcw, Wallet, Check, Sparkles, Menu, X,
  ArrowUpRight, ArrowDownRight, Settings2, Info, Download, Upload, CalendarRange, RefreshCw, UserRound,
  Cloud, CloudOff,
} from 'lucide-react'
import {
  Card, Pill, Segmented, Field, Modal, Toast, IconButton,
} from './components/UI'
import BootMark from './components/BootMark'
import AuthScreen from './components/AuthScreen'
import Overview from './screens/Overview'
import Expenses from './screens/Expenses'
import Savings from './screens/Savings'
import Bills from './screens/Bills'
import { translate, dict } from './i18n'
import {
  TODAY, EXCHANGE_RATE as DEFAULT_RATE, SALARY_DAY,
  initialWallets, initialTransactions, initialGoals, initialGeneralSavings, initialBills,
} from './data'
import {
  cycleFor, isInCycle, daysBetween, addMonths, convert, formatMoney, formatDate, uid,
} from './utils'
import { loadState, saveState, clearState } from './services/storage'
import { writeBackup, readBackupFile } from './services/backup'
import {
  scheduleBillReminders, isNotificationSupported,
  getNotificationPermission, requestNotificationPermission,
} from './services/notifications'
import { loadCachedRate, fetchExchangeRate, saveManualRate } from './services/exchangeRate'
import {
  isFirebaseConfigured, watchAuth, signInWithGoogle, signOutUser,
  loadRemote, saveRemote, subscribeRemote,
} from './services/cloud'

const NAV = [
  { id: 'overview', icon: LayoutDashboard, key: 'nav.overview' },
  { id: 'expenses', icon: ReceiptText, key: 'nav.expenses' },
  { id: 'savings', icon: PiggyBank, key: 'nav.savings' },
  { id: 'bills', icon: CalendarDays, key: 'nav.bills' },
]

const MODAL_TITLES = {
  expense: 'modal.expenseTitle',
  income: 'modal.incomeTitle',
  deposit: 'modal.depositTitle',
  withdraw: 'modal.withdrawTitle',
  bill: 'modal.billTitle',
  debt: 'modal.debtTitle',
  goal: 'modal.goalTitle',
  wallet: 'modal.walletTitle',
}

const INITIAL_FORM = {
  amount: '',
  currency: 'SYP',
  label: '',
  date: TODAY,
  goalId: 'general',
  reason: '',
  name: '',
  dueDate: TODAY,
  recurring: true,
  icon: 'target',
  base: '',
  carry: '',
}

const AUTH_DISMISSED_KEY = 'mizan-auth-dismissed'

/** هل أُدخل المستخدم بياناتاً فعلية؟ يُستخدم لتجنب كتابة نسخة فارغة فوق نسخة سحابية موجودة */
function hasUserData(s) {
  if (!s) return false
  if (Array.isArray(s.transactions) && s.transactions.length) return true
  if (Array.isArray(s.goals) && s.goals.length) return true
  if (Array.isArray(s.bills) && s.bills.length) return true
  if (typeof s.userName === 'string' && s.userName.trim()) return true
  const currencies = ['SYP', 'USD']
  if (s.generalSavings && currencies.some((c) => Number(s.generalSavings[c]) > 0)) return true
  if (s.wallets && currencies.some((c) => Number(s.wallets[c]?.base) > 0 || Number(s.wallets[c]?.carry) > 0)) return true
  return false
}

function FormModal({ type, prefill, goals, generalSavings, t, lang, rate, onClose, onSubmit }) {
  const [form, setForm] = React.useState(() => ({ ...INITIAL_FORM, ...(prefill || {}) }))
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const isSavings = type === 'deposit' || type === 'withdraw'
  const isBill = type === 'bill' || type === 'debt'
  const isGoal = type === 'goal'
  const isWallet = type === 'wallet'
  const showLabel = type === 'expense'

  const submit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal
      title={t(MODAL_TITLES[type])}
      subtitle={t('misc.localNote')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>{t('actions.cancel')}</button>
          <button type="submit" form="mizan-form" className="btn primary">
            <Check size={16} /> {isWallet ? t('actions.save') : t('modal.submit')}
          </button>
        </>
      }
    >
      <form id="mizan-form" className="form-grid" onSubmit={submit}>
        {!isWallet && (
          <Field label={t('modal.amount')}>
            <div className="amount-input">
              <input
                type="number" min="0" step={form.currency === 'USD' ? '0.01' : '100'}
                value={form.amount} onChange={(e) => set('amount', e.target.value)}
                placeholder="0" autoFocus required
              />
              <span className="amount-currency">{form.currency === 'USD' ? '$' : (lang === 'ar' ? 'ل.س' : 'SYP')}</span>
            </div>
          </Field>
        )}

        {isWallet && (
          <>
            <Field label={t('overview.baseAmount')}>
              <input type="number" min="0" step={form.currency === 'USD' ? '0.01' : '100'} value={form.base} onChange={(e) => set('base', e.target.value)} placeholder="0" autoFocus required />
            </Field>
            <Field label={t('overview.carryOver')}>
              <input type="number" min="0" step={form.currency === 'USD' ? '0.01' : '100'} value={form.carry} onChange={(e) => set('carry', e.target.value)} placeholder="0" required />
            </Field>
          </>
        )}

        <Field label={t('modal.wallet')}>
          <Segmented
            options={[{ value: 'SYP', label: t('currency.SYP') }, { value: 'USD', label: t('currency.USD') }]}
            value={form.currency}
            onChange={(v) => set('currency', v)}
          />
        </Field>

        {showLabel && (
          <Field label={t('modal.description')}>
            <input
              value={form.label} onChange={(e) => set('label', e.target.value)}
              placeholder={t('modal.descriptionPlaceholder')} required
            />
          </Field>
        )}

        {type === 'expense' && (
          <div className="form-note">
            <CalendarRange size={15} />
            <span>{t('header.today')} · {formatDate(TODAY, lang, true)}</span>
          </div>
        )}

        {type === 'deposit' && (
          <Field label={t('modal.goal')}>
            <select value={form.goalId} onChange={(e) => set('goalId', e.target.value)}>
              <option value="general">{t('savings.generalOption')} — {formatMoney(generalSavings[form.currency] || 0, form.currency, lang, form.currency === 'USD' ? 2 : 0)}</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{lang === 'ar' ? g.name : (g.nameEn || g.name)} · {g.currency}</option>
              ))}
            </select>
          </Field>
        )}

        {type === 'withdraw' && (
          <div className="form-note">
            <Wallet size={15} />
            <span>{t('savings.general')}: {formatMoney(generalSavings[form.currency] || 0, form.currency, lang, form.currency === 'USD' ? 2 : 0)}</span>
          </div>
        )}

        {type === 'withdraw' && (
          <Field label={t('modal.reason')}>
            <input value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder={t('modal.reasonPlaceholder')} required />
          </Field>
        )}

        {(isBill || isGoal) && (
          <Field label={t('modal.name')}>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('modal.namePlaceholder')} required />
          </Field>
        )}

        {isBill && (
          <Field label={t('modal.date')}>
            <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} required />
          </Field>
        )}

        {isGoal && (
          <>
            <Field label={t('modal.target')}>
              <input type="number" min="1" step={form.currency === 'USD' ? '10' : '100000'} value={form.target || ''} onChange={(e) => set('target', e.target.value)} required />
            </Field>
            <Field label={t('savings.goals')}>
              <select value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                <option value="target">{lang === 'ar' ? 'هدف عام' : 'General goal'}</option>
                <option value="laptop">{lang === 'ar' ? 'حاسوب محمول' : 'Laptop'}</option>
                <option value="plane">{lang === 'ar' ? 'رحلة' : 'Trip'}</option>
                <option value="shield">{lang === 'ar' ? 'صندوق طوارئ' : 'Emergency fund'}</option>
              </select>
            </Field>
          </>
        )}

        {isSavings && (
          <Field label={t('modal.date')}>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
        )}

        {type === 'bill' && (
          <label className="checkbox-row">
            <input type="checkbox" checked={form.recurring} onChange={(e) => set('recurring', e.target.checked)} />
            <span>{t('modal.recurring')}</span>
          </label>
        )}
      </form>
    </Modal>
  )
}

export default function App() {
  const [wallets, setWallets] = React.useState(initialWallets)
  const [transactions, setTransactions] = React.useState(initialTransactions)
  const [goals, setGoals] = React.useState(initialGoals)
  const [generalSavings, setGeneralSavings] = React.useState(initialGeneralSavings)
  const [bills, setBills] = React.useState(initialBills)

  const [userName, setUserName] = React.useState('')
  const [lang, setLang] = React.useState('ar')
  const [theme, setTheme] = React.useState('light')
  const [displayCurrency, setDisplayCurrency] = React.useState('SYP')
  const [salaryDay, setSalaryDay] = React.useState(SALARY_DAY)
  const [exchangeRate, setExchangeRate] = React.useState(DEFAULT_RATE)
  const [rateMeta, setRateMeta] = React.useState({ source: 'default', offline: true, updatedAt: null })
  const [notifStatus, setNotifStatus] = React.useState(
    isNotificationSupported() ? 'prompt' : 'unsupported',
  )
  const [hydrated, setHydrated] = React.useState(false)
  const [introDone, setIntroDone] = React.useState(false)

  const [authUser, setAuthUser] = React.useState(null)
  const [authChecked, setAuthChecked] = React.useState(!isFirebaseConfigured)
  const [authBusy, setAuthBusy] = React.useState(false)
  const [authError, setAuthError] = React.useState('')
  const [authDismissed, setAuthDismissed] = React.useState(() => {
    try { return localStorage.getItem(AUTH_DISMISSED_KEY) === '1' } catch { return false }
  })
  const [syncReady, setSyncReady] = React.useState(!isFirebaseConfigured)
  const [syncStatus, setSyncStatus] = React.useState(isFirebaseConfigured ? 'checking' : 'local')
  const [online, setOnline] = React.useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  const [tab, setTab] = React.useState('overview')
  const [modal, setModal] = React.useState(null)
  const [prefill, setPrefill] = React.useState(null)
  const [toast, setToast] = React.useState('')
  const [mobileMenu, setMobileMenu] = React.useState(false)
  const fileInputRef = React.useRef(null)

  const stateRef = React.useRef(null)
  const versionRef = React.useRef(Date.now())
  const echoRef = React.useRef(null)
  const syncTimerRef = React.useRef(null)
  const unsubscribeRemoteRef = React.useRef(null)
  const authUserRef = React.useRef(null)

  const t = React.useCallback((key, vars) => translate(lang, key, vars), [lang])

  const applySnapshot = React.useCallback((saved) => {
    if (!saved) return
    if (saved.wallets) setWallets(saved.wallets)
    if (Array.isArray(saved.transactions)) setTransactions(saved.transactions)
    if (Array.isArray(saved.goals)) setGoals(saved.goals)
    if (saved.generalSavings) setGeneralSavings(saved.generalSavings)
    if (Array.isArray(saved.bills)) setBills(saved.bills)
    if (saved.lang) setLang(saved.lang)
    if (saved.theme) setTheme(saved.theme)
    if (saved.displayCurrency) setDisplayCurrency(saved.displayCurrency)
    if (saved.salaryDay) setSalaryDay(saved.salaryDay)
    if (typeof saved.userName === 'string') setUserName(saved.userName)
    if (Number(saved.exchangeRate) > 0) setExchangeRate(Number(saved.exchangeRate))
    if (saved.rateMeta?.source) setRateMeta(saved.rateMeta)
  }, [])

  // مرجع سريع للحالة الحالية حتى لا نقرأ قيماً قديمة داخل وعود المزامنة
  stateRef.current = {
    wallets, transactions, goals, generalSavings, bills, lang, theme, displayCurrency, salaryDay,
    userName, exchangeRate, rateMeta, updatedAt: versionRef.current,
  }

  // تحميل الحالة من التخزين المحلي (Preferences على الجوال / localStorage على الويب)
  React.useEffect(() => {
    let active = true
    Promise.all([loadState(), loadCachedRate(), getNotificationPermission()])
      .then(([saved, cachedRate, permission]) => {
        if (!active) return
        if (saved) {
          applySnapshot(saved)
          if (Number(saved.updatedAt) > 0) versionRef.current = Number(saved.updatedAt)
        } else {
          setExchangeRate(cachedRate.rate)
          setRateMeta(cachedRate)
        }
        if (permission) setNotifStatus(permission)
      })
      .finally(() => {
        if (active) setHydrated(true)
      })
    return () => { active = false }
  }, [applySnapshot])

  // متابعة حالة تسجيل الدخول (محفوظة من الجلسة السابقة على الجهاز)
  React.useEffect(() => {
    if (!isFirebaseConfigured) return
    let active = true
    const unsubscribe = watchAuth((user) => {
      if (!active) return
      authUserRef.current = user
      setAuthUser(user)
      setAuthChecked(true)
    })
    return () => { active = false; unsubscribe?.() }
  }, [])

  // متابعة الاتصال بالإنترنت لاستئناف المزامنة تلقائياً عند عودة الشبكة
  React.useEffect(() => {
    const update = () => setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  // مشهد الافتتاح: نُبقي شاشة الشعار حتى تنتهي حركة تكوّنه ثم نظهر التطبيق
  React.useEffect(() => {
    if (!hydrated || !authChecked) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = setTimeout(() => setIntroDone(true), reduced ? 600 : 4400)
    return () => clearTimeout(timer)
  }, [hydrated, authChecked])

  // عند تسجيل الدخول: تُستعاد نسخة السحابة إن كانت أحدث، أو تُرفع النسخة المحلية إن كانت هي الأحدث
  const cloudUid = authUser?.uid
  React.useEffect(() => {
    if (!cloudUid) {
      setSyncReady(false)
      setSyncStatus('local')
      return
    }
    let active = true
    setSyncReady(false)
    setSyncStatus('syncing')
    ;(async () => {
      try {
        const remote = await loadRemote(cloudUid)
        if (!active) return
        const local = stateRef.current
        const localVersion = Number(local?.updatedAt) || 0
        if (remote && (!hasUserData(local) || remote.updatedAt > localVersion)) {
          echoRef.current = remote.updatedAt
          versionRef.current = remote.updatedAt
          applySnapshot(remote.state)
        } else {
          const version = localVersion || Date.now()
          await saveRemote(cloudUid, { ...local, updatedAt: version }, version)
          echoRef.current = version
        }
        if (!active) return
        setSyncReady(true)
        setSyncStatus(navigator.onLine ? 'saved' : 'offline')
        unsubscribeRemoteRef.current = subscribeRemote(cloudUid, (incoming) => {
          if (!incoming || incoming.updatedAt <= versionRef.current) return
          echoRef.current = incoming.updatedAt
          versionRef.current = incoming.updatedAt
          applySnapshot(incoming.state)
        })
      } catch (error) {
        console.warn('Mizan: cloud load failed', error)
        if (!active) return
        setSyncReady(true)
        setSyncStatus(navigator.onLine ? 'error' : 'offline')
      }
    })()
    return () => {
      active = false
      unsubscribeRemoteRef.current?.()
      unsubscribeRemoteRef.current = null
    }
  }, [cloudUid, applySnapshot])

  // تحديث سعر الصرف من الشبكة عند الإقلاع (مع الرجوع لآخر سعر محفوظ عند الفشل)
  React.useEffect(() => {
    if (!hydrated) return
    let active = true
    fetchExchangeRate().then((meta) => {
      if (!active) return
      setExchangeRate(meta.rate)
      setRateMeta(meta)
    })
    return () => { active = false }
  }, [hydrated])

  React.useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
    root.dataset.theme = theme
  }, [lang, theme])

  // الحفظ المحلي فوري، ثم دفع السحابة بعد تهدئة قصيرة لتجنب كتابة كل حرف أو نقرة
  React.useEffect(() => {
    if (!hydrated) return
    const isEcho = echoRef.current !== null && echoRef.current === versionRef.current
    if (!isEcho) versionRef.current = Date.now()
    echoRef.current = null
    if (stateRef.current) stateRef.current.updatedAt = versionRef.current
    const snapshot = {
      wallets, transactions, goals, generalSavings, bills, lang, theme, displayCurrency, salaryDay,
      userName, exchangeRate, rateMeta, updatedAt: versionRef.current,
    }
    saveState(snapshot)

    if (!isFirebaseConfigured || !authUser || !syncReady) return
    if (!online) {
      setSyncStatus('offline')
      return
    }
    const uid = authUser.uid
    const version = versionRef.current
    setSyncStatus('syncing')
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      try {
        await saveRemote(uid, snapshot, version)
        if (authUserRef.current?.uid === uid && versionRef.current === version) setSyncStatus('saved')
      } catch (error) {
        console.warn('Mizan: cloud push failed', error)
        if (authUserRef.current?.uid === uid) setSyncStatus('error')
      }
    }, 900)
    return () => clearTimeout(syncTimerRef.current)
  }, [hydrated, wallets, transactions, goals, generalSavings, bills, lang, theme, displayCurrency, salaryDay, userName, exchangeRate, rateMeta, authUser, syncReady, online])

  // إعادة جدولة تنبيهات الفواتير والديون عند أي تغيير
  React.useEffect(() => {
    if (!hydrated) return
    scheduleBillReminders(bills, t, lang)
  }, [hydrated, bills, t, lang])

  // القائمة الجانبية على الموبايل: إغلاق بـ Escape ومنع تمرير الخلفية
  React.useEffect(() => {
    if (!mobileMenu) return
    const onKey = (e) => { if (e.key === 'Escape') setMobileMenu(false) }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [mobileMenu])

  const cycle = React.useMemo(() => cycleFor(TODAY, salaryDay), [salaryDay])
  const cycleTransactions = React.useMemo(
    () => transactions.filter((x) => isInCycle(x.date, cycle)),
    [transactions, cycle],
  )

  const walletStats = React.useMemo(() => {
    const stats = {}
    ;['SYP', 'USD'].forEach((cur) => {
      const list = cycleTransactions.filter((x) => x.currency === cur)
      const base = wallets[cur]?.base || 0
      const carry = wallets[cur]?.carry || 0
      const extra = list.filter((x) => x.type === 'income').reduce((s, x) => s + x.amount, 0)
      const savings = list.filter((x) => x.type === 'savings').reduce((s, x) => s + x.amount, 0)
      const spent = list.filter((x) => x.type === 'expense' && x.funding !== 'savings').reduce((s, x) => s + x.amount, 0)
      const totalAvailable = base + carry + extra
      const spendable = totalAvailable - savings
      stats[cur] = { base, carry, extra, savings, spent, totalAvailable, spendable, remaining: spendable - spent }
    })
    return stats
  }, [cycleTransactions, wallets])

  const totals = React.useMemo(() => {
    const keys = ['totalAvailable', 'spendable', 'spent', 'remaining', 'savings']
    const out = {}
    keys.forEach((k) => {
      out[k] = ['SYP', 'USD'].reduce(
        (s, cur) => s + convert(walletStats[cur][k], cur, displayCurrency, exchangeRate), 0,
      )
    })
    out.savingsMonth = out.savings
    return out
  }, [walletStats, displayCurrency, exchangeRate])

  const savingsHistory = React.useMemo(
    () => transactions
      .filter((x) => x.type === 'savings' || x.source === 'withdrawal')
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions],
  )

  const reminders = React.useMemo(
    () => bills.filter((b) => b.status === 'unpaid' && daysBetween(b.dueDate, TODAY) <= 4),
    [bills],
  )

  const openModal = (type, data = null) => { setPrefill(data); setModal(type); setMobileMenu(false) }
  const closeModal = () => { setModal(null); setPrefill(null) }
  const notify = (message) => setToast(message)

  const signIn = async () => {
    setAuthBusy(true)
    setAuthError('')
    try {
      await signInWithGoogle()
      notify(t('toast.signedIn'))
    } catch (error) {
      console.warn('Mizan: Google sign-in failed', error)
      setAuthError(t('auth.error'))
    } finally {
      setAuthBusy(false)
    }
  }

  const continueLocally = () => {
    try { localStorage.setItem(AUTH_DISMISSED_KEY, '1') } catch { /* ignore */ }
    setAuthDismissed(true)
  }

  const signOut = async () => {
    await signOutUser()
    authUserRef.current = null
    setAuthUser(null)
    setSyncReady(false)
    setSyncStatus('local')
    notify(t('toast.signedOut'))
  }

  const refreshRate = async () => {
    const meta = await fetchExchangeRate()
    setExchangeRate(meta.rate)
    setRateMeta(meta)
    notify(meta.offline ? t('toast.rateOffline') : t('toast.rateUpdated'))
  }

  const applyManualRate = async (value) => {
    const meta = await saveManualRate(value)
    if (!meta) { notify(t('toast.invalid')); return }
    setExchangeRate(meta.rate)
    setRateMeta(meta)
    notify(t('toast.rateUpdated'))
  }

  const enableNotifications = async () => {
    const status = await requestNotificationPermission()
    setNotifStatus(status)
    if (status === 'granted') {
      await scheduleBillReminders(bills, t, lang)
      notify(t('toast.notificationsOn'))
    } else {
      notify(t('toast.notificationsOff'))
    }
  }

  const addExpense = (f) => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0 || !f.label.trim()) { notify(t('toast.invalid')); return }
    const remaining = walletStats[f.currency]?.remaining ?? 0
    const overrun = convert(amount, f.currency, 'SYP', exchangeRate) > convert(Math.max(0, remaining), f.currency, 'SYP', exchangeRate)
    setTransactions((prev) => [...prev, {
      id: uid('t'), type: 'expense', amount, currency: f.currency,
      label: f.label.trim(), labelEn: f.label.trim(), date: f.date || TODAY, funding: 'wallet',
    }])
    notify(overrun ? t('toast.overrun') : t('toast.expenseAdded'))
    closeModal()
  }

  const addIncome = (f) => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0) { notify(t('toast.invalid')); return }
    setTransactions((prev) => [...prev, {
      id: uid('t'), type: 'income', amount, currency: f.currency,
      label: dict.ar.overview.extraIncome, labelEn: dict.en.overview.extraIncome,
      date: f.date || TODAY,
    }])
    notify(t('toast.incomeAdded'))
    closeModal()
  }

  const addDeposit = (f) => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0) { notify(t('toast.invalid')); return }
    const goalId = f.goalId || 'general'
    setTransactions((prev) => [...prev, {
      id: uid('t'), type: 'savings', amount, currency: f.currency,
      label: goalId === 'general' ? t('savings.generalOption') : (goals.find((g) => g.id === goalId)?.name || ''),
      date: f.date || TODAY, goalId,
    }])
    if (goalId === 'general') {
      setGeneralSavings((prev) => ({ ...prev, [f.currency]: (prev[f.currency] || 0) + amount }))
    } else {
      setGoals((prev) => prev.map((g) => g.id === goalId
        ? { ...g, saved: g.saved + convert(amount, f.currency, g.currency, exchangeRate) }
        : g))
    }
    notify(t('toast.depositAdded'))
    closeModal()
  }

  const withdraw = (f) => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0 || !f.reason.trim()) { notify(t('toast.invalid')); return }
    if (amount > (generalSavings[f.currency] || 0)) { notify(t('toast.insufficient')); return }
    setGeneralSavings((prev) => ({ ...prev, [f.currency]: (prev[f.currency] || 0) - amount }))
    setTransactions((prev) => [...prev, {
      id: uid('t'), type: 'expense', amount, currency: f.currency,
      label: f.reason.trim(), labelEn: f.reason.trim(), date: f.date || TODAY,
      funding: 'savings', source: 'withdrawal',
    }])
    notify(t('toast.withdrawDone'))
    closeModal()
  }

  const payBill = (id) => {
    const bill = bills.find((b) => b.id === id)
    if (!bill || bill.status === 'paid') return
    const paidDate = TODAY
    setBills((prev) => {
      const updated = prev.map((b) => b.id === id ? { ...b, status: 'paid', paidDate } : b)
      if (bill.recurring) {
        updated.push({ ...bill, id: uid('b'), dueDate: addMonths(bill.dueDate, 1), status: 'unpaid', paidDate: undefined })
      }
      return updated
    })
    setTransactions((prev) => [...prev, {
      id: uid('t'), type: 'expense', amount: bill.amount, currency: bill.currency,
      label: lang === 'ar' ? bill.name : (bill.nameEn || bill.name),
      labelEn: bill.nameEn || bill.name, date: paidDate, funding: 'wallet', source: bill.kind,
    }])
    notify(t('toast.billPaid'))
  }

  const addBillOrDebt = (type, f) => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0 || !f.name.trim() || !f.dueDate) { notify(t('toast.invalid')); return }
    setBills((prev) => [...prev, {
      id: uid(type === 'bill' ? 'b' : 'd'),
      kind: type,
      name: f.name.trim(), nameEn: f.name.trim(),
      amount, currency: f.currency, dueDate: f.dueDate,
      recurring: type === 'bill' ? !!f.recurring : false,
      status: 'unpaid', icon: type === 'bill' ? 'receipt' : 'hand-coins',
    }])
    notify(type === 'bill' ? t('toast.billAdded') : t('toast.debtAdded'))
    closeModal()
  }

  const addGoal = (f) => {
    const target = Number(f.target)
    if (!target || target <= 0 || !f.name.trim()) { notify(t('toast.invalid')); return }
    setGoals((prev) => [...prev, {
      id: uid('g'), name: f.name.trim(), nameEn: f.name.trim(),
      target, saved: 0, currency: f.currency, icon: f.icon || 'target',
    }])
    notify(t('toast.goalAdded'))
    closeModal()
  }

  const saveWallet = (f) => {
    const base = Math.max(0, Number(f.base) || 0)
    const carry = Math.max(0, Number(f.carry) || 0)
    setWallets((prev) => ({ ...prev, [f.currency]: { base, carry } }))
    notify(t('toast.walletSaved'))
    closeModal()
  }

  const handleSubmit = (f) => {
    if (modal === 'wallet') saveWallet(f)
    else if (modal === 'expense') addExpense(f)
    else if (modal === 'income') addIncome(f)
    else if (modal === 'deposit') addDeposit(f)
    else if (modal === 'withdraw') withdraw(f)
    else if (modal === 'bill' || modal === 'debt') addBillOrDebt(modal, f)
    else if (modal === 'goal') addGoal(f)
  }

  const resetData = async () => {
    await clearState()
    setWallets(initialWallets)
    setTransactions(initialTransactions)
    setGoals(initialGoals)
    setGeneralSavings(initialGeneralSavings)
    setBills(initialBills)
    setSalaryDay(SALARY_DAY)
    setUserName('')
    notify(t('toast.reset'))
  }

  const exportData = async () => {
    const payload = {
      version: 1, exportedAt: new Date().toISOString(),
      wallets, transactions, goals, generalSavings, bills, salaryDay, userName, exchangeRate, rateMeta,
    }
    await writeBackup(`mizan-backup-${TODAY}.json`, JSON.stringify(payload, null, 2))
    notify(t('toast.exported'))
  }

  const importData = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await readBackupFile(file)
      const data = JSON.parse(text)
      if (!data.wallets || !Array.isArray(data.transactions) || !Array.isArray(data.bills)) throw new Error('bad')
      setWallets(data.wallets)
      setTransactions(data.transactions)
      setGoals(Array.isArray(data.goals) ? data.goals : initialGoals)
      setGeneralSavings(data.generalSavings || initialGeneralSavings)
      setBills(data.bills)
      if (data.salaryDay) setSalaryDay(data.salaryDay)
      if (typeof data.userName === 'string') setUserName(data.userName)
      if (Number(data.exchangeRate) > 0) setExchangeRate(Number(data.exchangeRate))
      if (data.rateMeta?.source) setRateMeta(data.rateMeta)
      notify(t('toast.imported'))
    } catch {
      notify(t('toast.importError'))
    }
  }

  const screenProps = {
    t, lang, displayCurrency, rate: exchangeRate, totals, walletStats,
    cycle, cycleTransactions, transactions, goals, generalSavings, savingsHistory,
    bills, reminders, convert, cv: convert, onPayBill: payBill,
    onOpenModal: openModal, onNavigate: setTab,
  }

  const langOptions = [{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'EN' }]
  const curOptions = [
    { value: 'SYP', label: t('currency.SYP') },
    { value: 'USD', label: t('currency.USD') },
  ]

  if (!hydrated || !authChecked || !introDone) {
    return (
      <div className="boot-screen">
        <BootMark />
        <strong>{t('app.name')}</strong>
        <span className="boot-tagline">{t('app.tagline')}</span>
      </div>
    )
  }

  // أول فتح: نعرض دعوة تسجيل الدخول قبل الدخول للتطبيق، إلا إن اختار المتابعة محلياً
  if (isFirebaseConfigured && !authUser && !authDismissed) {
    return (
      <AuthScreen
        t={t}
        lang={lang}
        onLang={setLang}
        onSignIn={signIn}
        onContinue={continueLocally}
        busy={authBusy}
        error={authError}
      />
    )
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
        <button className="drawer-handle" onClick={() => setMobileMenu(false)} aria-label={t('actions.closeMenu')} />
        <div className="brand">
          <span className="brand-mark"><img className="brand-scale" src="/mizan-mark.svg" alt="" /></span>
          <div>
            <strong>{t('app.name')}</strong>
            <span>{t('app.tagline')}</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="close"><X size={18} /></button>
        </div>

        <nav className="nav">
          <span className="nav-label">{t('misc.settings')}</span>
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${tab === item.id ? 'active' : ''}`}
                onClick={() => { setTab(item.id); setMobileMenu(false) }}
              >
                <Icon size={19} strokeWidth={2} />
                <span>{t(item.key)}</span>
                {tab === item.id && <span className="nav-active-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="settings-card">
            <div className="settings-title"><Settings2 size={14} /> {t('misc.settings')}</div>
            <div className="settings-row">
              <span><Languages size={14} /> {t('misc.language')}</span>
              <Segmented options={langOptions} value={lang} onChange={setLang} />
            </div>
            <div className="settings-row">
              <span>{theme === 'light' ? <Sun size={14} /> : <Moon size={14} />} {t('misc.theme')}</span>
              <button
                className={`theme-toggle ${theme}`}
                onClick={() => setTheme((v) => v === 'light' ? 'dark' : 'light')}
                aria-label={t('misc.theme')}
              >
                <span className="theme-knob">{theme === 'light' ? '☀' : '☾'}</span>
              </button>
            </div>
            <div className="settings-row">
              <span><CalendarRange size={14} /> {t('misc.salaryDay')}</span>
              <input
                className="day-input num"
                type="number" min="1" max="28"
                value={salaryDay}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v >= 1 && v <= 28) setSalaryDay(v)
                }}
                aria-label={t('misc.salaryDay')}
              />
            </div>
            <div className="settings-row">
              <span><UserRound size={14} /> {t('misc.yourName')}</span>
              <input
                className="name-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('misc.namePlaceholder')}
                aria-label={t('misc.yourName')}
              />
            </div>
            <div className="settings-row">
              <span><Wallet size={14} /> {t('misc.currencyToggle')}</span>
              <Segmented options={curOptions} value={displayCurrency} onChange={setDisplayCurrency} />
            </div>
            <div className="settings-row rate-row">
              <span><RefreshCw size={14} /> {t('misc.rate')}</span>
              <div className="rate-control">
                <span className="rate-value" title={rateMeta.updatedAt || ''}>
                  <input
                    className="rate-input num"
                    type="number" min="1000" max="200000"
                    key={exchangeRate}
                    defaultValue={Math.round(exchangeRate)}
                    onBlur={(e) => applyManualRate(e.target.value)}
                    aria-label={t('misc.rate')}
                  />
                  <small>{t('misc.rateShort', { rate: exchangeRate })} · {t(`misc.rateSource.${rateMeta.source || 'default'}`)}</small>
                </span>
                <button className="icon-btn ghost rate-refresh" onClick={refreshRate} aria-label={t('misc.refreshRate')}>
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
            {notifStatus !== 'unsupported' && (
              <div className="settings-row">
                <span><Bell size={14} /> {t('misc.notifications')}</span>
                {notifStatus === 'granted'
                  ? <span className="notif-on">{t('misc.notificationsOn')}</span>
                  : (
                    <button className="btn ghost small" onClick={enableNotifications}>
                      {t('misc.enableNotifications')}
                    </button>
                  )}
              </div>
            )}
            {isFirebaseConfigured && (
              <div className="settings-row account-row">
                <span><UserRound size={14} /> {t('sync.account')}</span>
                {authUser
                  ? <button className="btn ghost small" onClick={signOut}>{t('sync.signOut')}</button>
                  : <button className="btn ghost small" onClick={signIn} disabled={authBusy}>{t('sync.signIn')}</button>}
              </div>
            )}
          </div>
          <div className={`sync-chip ${syncStatus}`} title={authUser?.email || t(`sync.${syncStatus}`)}>
            {syncStatus === 'offline' ? <CloudOff size={13} /> : <Cloud size={13} />}
            <span>{t(`sync.${syncStatus}`)}</span>
          </div>
          <div className="backup-row">
            <button className="btn ghost small" onClick={exportData}><Download size={13} /> {t('actions.export')}</button>
            <button className="btn ghost small" onClick={() => fileInputRef.current?.click()}><Upload size={13} /> {t('actions.import')}</button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={importData} />
          <button className="reset-btn" onClick={resetData}><RotateCcw size={14} /> {t('actions.reset')}</button>
          <div className="demo-note"><Info size={13} /> {t('misc.localNote')}</div>
          <div className="sidebar-user">
            <span className="avatar">{userName.trim() ? userName.trim()[0] : '⚖'}</span>
            <div><strong>{userName.trim() || t('misc.yourName')}</strong><span>{authUser?.email || t('misc.localData')}</span></div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn icon-btn ghost" onClick={() => setMobileMenu(true)} aria-label="menu"><Menu size={20} /></button>
            <div className="greeting">
              <span>{userName.trim() ? `${t('header.greeting')}، ${userName.trim()}` : t('header.greeting')} 👋</span>
              <strong>{formatMoney(totals.remaining, displayCurrency, lang)} <small>{t('overview.remaining')}</small></strong>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="top-currency"><Segmented options={curOptions} value={displayCurrency} onChange={setDisplayCurrency} /></div>
            <IconButton icon={Bell} label={t('header.notifications')} tone="surface" badge={reminders.length} onClick={() => setTab('bills')} />
          </div>
        </header>

        <main className="content">
          <div className="page-transition" key={tab}>
            {tab === 'overview' && <Overview {...screenProps} />}
            {tab === 'expenses' && <Expenses {...screenProps} />}
            {tab === 'savings' && <Savings {...screenProps} />}
            {tab === 'bills' && <Bills {...screenProps} />}
          </div>
        </main>
      </div>

      <nav className="mobile-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <Icon size={20} strokeWidth={tab === item.id ? 2.4 : 1.9} />
              <span>{t(item.key).split(' ')[0]}</span>
            </button>
          )
        })}
      </nav>

      <div className={`mobile-scrim ${mobileMenu ? 'open' : ''}`} onClick={() => setMobileMenu(false)} aria-hidden="true" />

      {modal && (
        <FormModal
          type={modal}
          prefill={prefill}
          goals={goals}
          generalSavings={generalSavings}
          t={t}
          lang={lang}
          rate={exchangeRate}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
