import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

/**
 * يكتب ملف النسخة الاحتياطية:
 * - على التطبيق الأصلي يحفظ الملف في مجلد Documents
 * - على الويب ينزّله مباشرة عبر المتصفح
 */
export async function writeBackup(filename, json) {
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: json,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return { native: true, uri: result.uri }
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return { native: false }
}

/** يقرأ محتوى ملف اختياره المستخدم */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** يعرض قائمة النسخ المحفوظة على الجهاز (للاستخدام لاحقاً) */
export async function listBackups() {
  if (!Capacitor.isNativePlatform()) return []
  const { files } = await Filesystem.readdir({
    path: '',
    directory: Directory.Documents,
  })
  return files.filter((f) => f.name?.startsWith('mizan-backup-'))
}
