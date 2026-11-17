import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { EXCHANGE_RATE } from '../data'

const CACHE_KEY = 'mizan-rate-v1'
const API_URL = 'https://open.er-api.com/v6/latest/USD'

// بعض المصادر المجانية تعيد سعراً رسمياً قديماً (≈121 ل.س)، لذلك نرفض
// أي قيمة خارج النطاق المنطقي ونعتمد آخر سعر محفوظ أو السعر الافتراضي.
const MIN_RATE = 1000
const MAX_RATE = 200000

function plausible(rate) {
  const n = Number(rate)
  return Number.isFinite(n) && n >= MIN_RATE && n <= MAX_RATE
}

/** يقرأ آخر سعر محفوظ على الجهاز */
async function readCache() {
  try {
    let raw = null
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: CACHE_KEY })
      raw = value
    } else {
      raw = localStorage.getItem(CACHE_KEY)
    }
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** يحفظ السعرLast knownGood لاستخدامه عند انقطاع الإنترنت */
async function writeCache(rate, updatedAt, source = 'live') {
  const value = JSON.stringify({ rate, updatedAt, source, fetchedAt: new Date().toISOString() })
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: CACHE_KEY, value })
    } else {
      localStorage.setItem(CACHE_KEY, value)
    }
  } catch {
    // التخزين قد يكون غير متاح — لا مشكلة، نكمل بالقيمة الافتراضية
  }
}

/** يعيد آخر سعر محفوظ أو السعر الافتراضي (بدون شبكة) */
export async function loadCachedRate() {
  const cached = await readCache()
  if (plausible(cached?.rate)) {
    return {
      rate: Number(cached.rate),
      source: cached.source || 'cached',
      updatedAt: cached.updatedAt || null,
      offline: true,
    }
  }
  return { rate: EXCHANGE_RATE, source: 'default', updatedAt: null, offline: true }
}

/** يحفظ سعراً أدخله المستخدم يدوياً (مثال: سعر السوق المحلي) */
export async function saveManualRate(rate) {
  if (!plausible(rate)) return null
  const value = Number(rate)
  const updatedAt = new Date().toISOString()
  await writeCache(value, updatedAt, 'manual')
  return { rate: value, source: 'manual', updatedAt, offline: false }
}

/**
 * يجلب سعر الصرف من الشبكة. عند أي فشل (لا إنترنت / CORS / استجابة خاطئة)
 * يعود إلى آخر سعر محفوظ، أو إلى السعر الافتراضي كحالة أخيرة.
 */
export async function fetchExchangeRate() {
  const cached = await readCache()
  const fallback = {
    rate: plausible(cached?.rate) ? Number(cached.rate) : EXCHANGE_RATE,
    source: plausible(cached?.rate) ? (cached.source || 'cached') : 'default',
    updatedAt: cached?.updatedAt || null,
    offline: true,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(API_URL, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    const rate = Number(data?.rates?.SYP)
    if (!plausible(rate)) throw new Error('implausible rate')

    const updatedAt = data.time_last_update_utc || new Date().toISOString()
    await writeCache(rate, updatedAt, 'live')
    return { rate, source: 'live', updatedAt, offline: false }
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}
