import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { daysBetween } from '../utils'
import { TODAY } from '../data'

const HOUR = 9

/** الإشعارات المحلية متاحة على التطبيق الأصلي فقط */
export function isNotificationSupported() {
  return Capacitor.isNativePlatform()
}

/** يفحص حالة إذن الإشعارات دون طلبه */
export async function getNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return 'unsupported'
  try {
    const { display } = await LocalNotifications.checkPermissions()
    return display
  } catch {
    return 'unknown'
  }
}

/** يطلب إذن الإشعارات من المستخدم ويعيد الحالة النهائية */
export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return 'unsupported'
  try {
    const { display } = await LocalNotifications.requestPermissions()
    return display
  } catch {
    return 'error'
  }
}

function atNine(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1, HOUR, 0, 0)
  return date
}

function shiftDays(dateStr, count) {
  const date = atNine(dateStr)
  date.setDate(date.getDate() + count)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/**
 * يعيد جدولة تنبيهات الفواتير والديون:
 * 4 / 3 / 2 / 1 أيام قبل الموعد الساعة 9 صباحاً،
 * يوم الاستحقاق، ثم تنبيه يومي لمدة 7 أيام بعد التأخير حتى الدفع.
 */
export async function scheduleBillReminders(bills, translate, lang) {
  if (!Capacitor.isNativePlatform()) return { native: false, count: 0 }

  try {
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return { native: true, count: 0 }

    await LocalNotifications.cancelAll()

    const notifications = []
    let id = 1000

    const addNotification = (name, dateStr, body) => {
      notifications.push({
        id: id++,
        title: `${name} — ${translate('bills.reminderTitle')}`,
        body,
        schedule: { at: atNine(dateStr), allowWhileIdle: true },
      })
    }

    bills.filter((b) => b.status === 'unpaid').forEach((bill) => {
      const name = lang === 'en'
        ? (bill.nameEn || bill.name)
        : bill.name
      const dueIn = daysBetween(bill.dueDate, TODAY)

      if (dueIn > 0) {
        // قبل الاستحقاق: 4 / 3 / 2 / 1 أيام، ثم يوم الاستحقاق الساعة 9 صباحاً
        ;[-4, -3, -2, -1, 0].forEach((offset) => {
          const dateStr = shiftDays(bill.dueDate, offset)
          if (daysBetween(dateStr, TODAY) < 0) return
          const body = offset < 0
            ? translate('bills.dueIn', { days: Math.abs(offset) })
            : translate('bills.dueToday')
          addNotification(name, dateStr, body)
        })
      } else {
        // بعد الاستحقاق: تنبيه يومي لمدة 7 أيام من اليوم حتى الدفع
        for (let i = 0; i < 7; i++) {
          const dateStr = shiftDays(TODAY, i)
          const overdueDays = i === 0 && dueIn === 0
            ? 0
            : Math.abs(Math.min(dueIn, 0)) + i
          const body = overdueDays === 0
            ? translate('bills.dueToday')
            : translate('bills.overdueBy', { days: overdueDays })
          addNotification(name, dateStr, body)
        }
      }
    })

    if (notifications.length) await LocalNotifications.schedule({ notifications })
    return { native: true, count: notifications.length }
  } catch (error) {
    console.warn('Mizan: notification scheduling failed', error)
    return { native: true, count: 0, error }
  }
}
