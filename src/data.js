// تاريخ اليوم الفعلي يُحسب عند فتح التطبيق
function todayString() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export const TODAY = todayString()
export const SALARY_DAY = 25
export const EXCHANGE_RATE = 15000 // السعر الافتراضي قبل أول جلب/إدخال يدوي

// يبدأ التطبيق فارغاً — يُدخل المستخدم جميع بياناته بنفسه
export const initialWallets = {
  SYP: { base: 0, carry: 0 },
  USD: { base: 0, carry: 0 },
}
export const initialTransactions = []
export const initialGoals = []
export const initialGeneralSavings = { SYP: 0, USD: 0 }
export const initialBills = []
