import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const KEY = 'mizan-state-v1'
const LEGACY_KEY = 'mizan-demo-v1'

/** يقرأ الحالة من التخزين الأصلي (Preferences) أو من localStorage على الويب */
export async function loadState() {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: KEY })
      if (value) return JSON.parse(value)
    }
  } catch (error) {
    console.warn('Mizan: Preferences read failed', error)
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }

  // ترحيل بيانات النسخة التجريبية القديمة إلى المفتاح الجديد
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      await saveState(parsed)
      localStorage.removeItem(LEGACY_KEY)
      return parsed
    }
  } catch { /* ignore */ }
  return null
}

/** يحفظ الحالة في التخزين الأصلي أو في localStorage على الويب */
export async function saveState(state) {
  const value = JSON.stringify(state)
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: KEY, value })
      return true
    }
  } catch (error) {
    console.warn('Mizan: Preferences write failed', error)
  }
  try {
    localStorage.setItem(KEY, value)
    return true
  } catch {
    return false
  }
}

/** يمسح الحالة المحفوظة */
export async function clearState() {
  try {
    if (Capacitor.isNativePlatform()) await Preferences.remove({ key: KEY })
  } catch (error) {
    console.warn('Mizan: Preferences remove failed', error)
  }
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}
