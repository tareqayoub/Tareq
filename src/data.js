// تاريخ اليوم الفعلي (يُستخدم في التطبيق الحقيقي)
function todayString() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export const TODAY = todayString()

// تاريخ ثابت للبيانات التجريبية الأولى فقط
export const DEMO_TODAY = '2026-11-17'
export const SALARY_DAY = 25
export const EXCHANGE_RATE = 15000 // 1 USD = 15,000 SYP

export const USER = { nameAr: 'رامي', nameEn: 'Rami' }

export const initialWallets = {
  SYP: { base: 5000000, carry: 2000000 },
  USD: { base: 100, carry: 20 },
}

export const initialTransactions = [
  // نفقات بالليرة
  { id: 't01', type: 'expense', amount: 180000, currency: 'SYP', label: 'بقالة', labelEn: 'Groceries', date: '2026-10-26', funding: 'wallet' },
  { id: 't02', type: 'expense', amount: 25000, currency: 'SYP', label: 'مواصلات', labelEn: 'Transport', date: '2026-10-27', funding: 'wallet' },
  { id: 't03', type: 'expense', amount: 320000, currency: 'SYP', label: 'أغراض منزلية', labelEn: 'Home supplies', date: '2026-10-29', funding: 'wallet' },
  { id: 't04', type: 'expense', amount: 35000, currency: 'SYP', label: 'قهوة', labelEn: 'Coffee', date: '2026-10-30', funding: 'wallet' },
  { id: 't05', type: 'expense', amount: 140000, currency: 'SYP', label: 'بقالة', labelEn: 'Groceries', date: '2026-11-01', funding: 'wallet' },
  { id: 't06', type: 'expense', amount: 210000, currency: 'SYP', label: 'مطعم', labelEn: 'Restaurant', date: '2026-11-02', funding: 'wallet' },
  { id: 't07', type: 'expense', amount: 150000, currency: 'SYP', label: 'بنزين', labelEn: 'Fuel', date: '2026-11-03', funding: 'wallet' },
  { id: 't08', type: 'expense', amount: 90000, currency: 'SYP', label: 'صيدلية', labelEn: 'Pharmacy', date: '2026-11-04', funding: 'wallet' },
  { id: 't09', type: 'expense', amount: 450000, currency: 'SYP', label: 'ملابس', labelEn: 'Clothes', date: '2026-11-05', funding: 'wallet' },
  { id: 't10', type: 'expense', amount: 120000, currency: 'SYP', label: 'فاتورة إنترنت', labelEn: 'Internet bill', date: '2026-11-07', funding: 'wallet', source: 'bill' },
  { id: 't11', type: 'expense', amount: 30000, currency: 'SYP', label: 'مواصلات', labelEn: 'Transport', date: '2026-11-08', funding: 'wallet' },
  { id: 't12', type: 'expense', amount: 160000, currency: 'SYP', label: 'بقالة', labelEn: 'Groceries', date: '2026-11-10', funding: 'wallet' },
  { id: 't13', type: 'expense', amount: 40000, currency: 'SYP', label: 'قهوة', labelEn: 'Coffee', date: '2026-11-11', funding: 'wallet' },
  { id: 't14', type: 'expense', amount: 350000, currency: 'SYP', label: 'فاتورة كهرباء', labelEn: 'Electricity bill', date: '2026-11-12', funding: 'wallet', source: 'bill' },
  { id: 't15', type: 'expense', amount: 220000, currency: 'SYP', label: 'أغراض منزلية', labelEn: 'Home supplies', date: '2026-11-13', funding: 'wallet' },
  { id: 't16', type: 'expense', amount: 180000, currency: 'SYP', label: 'مطعم', labelEn: 'Restaurant', date: '2026-11-14', funding: 'wallet' },
  { id: 't17', type: 'expense', amount: 140000, currency: 'SYP', label: 'بنزين', labelEn: 'Fuel', date: '2026-11-15', funding: 'wallet' },
  { id: 't18', type: 'expense', amount: 100000, currency: 'SYP', label: 'هدية', labelEn: 'Gift', date: '2026-11-16', funding: 'wallet' },
  // نفقات بالدولار
  { id: 't19', type: 'expense', amount: 15, currency: 'USD', label: 'اشتراك برنامج', labelEn: 'Software subscription', date: '2026-10-28', funding: 'wallet' },
  { id: 't20', type: 'expense', amount: 20, currency: 'USD', label: 'كتب', labelEn: 'Books', date: '2026-11-06', funding: 'wallet' },
  { id: 't21', type: 'expense', amount: 10, currency: 'USD', label: 'تطبيقات', labelEn: 'Apps', date: '2026-11-09', funding: 'wallet' },
  // دخل إضافي
  { id: 't22', type: 'income', amount: 500000, currency: 'SYP', label: 'مشروع جانبي', labelEn: 'Side project', date: '2026-11-02' },
  // ادخار
  { id: 't23', type: 'savings', amount: 1000000, currency: 'SYP', label: 'لابتوب جديد', labelEn: 'New laptop', date: '2026-11-01', goalId: 'g1' },
]

export const initialGoals = [
  { id: 'g1', name: 'لابتوب جديد', nameEn: 'New laptop', target: 15000000, saved: 6000000, currency: 'SYP', icon: 'laptop' },
  { id: 'g2', name: 'رحلة', nameEn: 'Trip', target: 500, saved: 180, currency: 'USD', icon: 'plane' },
  { id: 'g3', name: 'صندوق طوارئ', nameEn: 'Emergency fund', target: 10000000, saved: 3500000, currency: 'SYP', icon: 'shield' },
]

export const initialGeneralSavings = { SYP: 1200000, USD: 100 }

export const initialBills = [
  { id: 'b1', kind: 'bill', name: 'كهرباء', nameEn: 'Electricity', amount: 350000, currency: 'SYP', dueDate: '2026-11-20', recurring: true, status: 'unpaid', icon: 'zap' },
  { id: 'b2', kind: 'bill', name: 'إنترنت', nameEn: 'Internet', amount: 120000, currency: 'SYP', dueDate: '2026-11-18', recurring: true, status: 'paid', paidDate: '2026-11-07', icon: 'wifi' },
  { id: 'b3', kind: 'bill', name: 'اشتراك موبايل', nameEn: 'Mobile plan', amount: 80000, currency: 'SYP', dueDate: '2026-11-15', recurring: true, status: 'unpaid', icon: 'smartphone' },
  { id: 'b4', kind: 'bill', name: 'إيجار', nameEn: 'Rent', amount: 1500000, currency: 'SYP', dueDate: '2026-11-25', recurring: true, status: 'unpaid', icon: 'home' },
  { id: 'd1', kind: 'debt', name: 'دين لأبو أحمد', nameEn: 'Debt to Abu Ahmad', amount: 500000, currency: 'SYP', dueDate: '2026-11-22', recurring: false, status: 'unpaid', icon: 'hand-coins' },
  { id: 'd2', kind: 'debt', name: 'قسط لابتوب', nameEn: 'Laptop installment', amount: 200, currency: 'USD', dueDate: '2026-12-01', recurring: false, status: 'unpaid', icon: 'credit-card' },
]

// بيانات تاريخية للمخططات
export const monthlyHistory = [
  { key: '2026-06', labelAr: 'حزيران', labelEn: 'Jun', value: 3200000 },
  { key: '2026-07', labelAr: 'تموز', labelEn: 'Jul', value: 2850000 },
  { key: '2026-08', labelAr: 'آب', labelEn: 'Aug', value: 3600000 },
  { key: '2026-09', labelAr: 'أيلول', labelEn: 'Sep', value: 2400000 },
  { key: '2026-10', labelAr: 'تشرين الأول', labelEn: 'Oct', value: 3100000 },
]

export const yearlyHistory = [
  { key: '2023', labelAr: '2023', labelEn: '2023', value: 28000000 },
  { key: '2024', labelAr: '2024', labelEn: '2024', value: 34000000 },
  { key: '2025', labelAr: '2025', labelEn: '2025', value: 41000000 },
]
