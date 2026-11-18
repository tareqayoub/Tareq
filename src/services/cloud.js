import { Capacitor } from '@capacitor/core'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider, getAuth, initializeAuth, indexedDBLocalPersistence,
  onAuthStateChanged, signInWithCredential, signInWithPopup, signOut,
} from 'firebase/auth'
import { doc, getDoc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { firebaseConfig, isFirebaseConfigured } from '../firebase.config'

export { isFirebaseConfigured }

let firebaseApp = null
let authInstance = null
let firestore = null

/** تهيئة Firebase مرة واحدة فقط، والباقي يعمل محلياً ما لم تُضبط المفاتيح */
function getFirebaseApp() {
  if (!isFirebaseConfigured) return null
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
  }
  return firebaseApp
}

export function getCloudAuth() {
  if (!isFirebaseConfigured) return null
  if (authInstance) return authInstance
  const app = getFirebaseApp()
  if (Capacitor.isNativePlatform()) {
    // على الجوال نحتاج استمرارية indexedDB ليظل JS SDK مسجّلاً بعد إعادة فتح التطبيق
    authInstance = initializeAuth(app, { persistence: indexedDBLocalPersistence })
  } else {
    authInstance = getAuth(app)
  }
  return authInstance
}

function getCloudDb() {
  if (!isFirebaseConfigured) return null
  if (!firestore) firestore = getFirestore(getFirebaseApp())
  return firestore
}

function normalizeUser(user) {
  if (!user) return null
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
  }
}

const stateDoc = (uid) => doc(getCloudDb(), 'users', uid)

/** مراقبة حالة تسجيل الدخول؛ تُستدعى مرة ويُعاد فيها المستخدم أو null */
export function watchAuth(callback) {
  if (!isFirebaseConfigured) {
    callback(null)
    return () => {}
  }
  try {
    return onAuthStateChanged(
      getCloudAuth(),
      (user) => callback(normalizeUser(user)),
      (error) => {
        console.warn('Mizan: auth state error', error)
        callback(null)
      },
    )
  } catch (error) {
    console.warn('Mizan: auth unavailable', error)
    callback(null)
    return () => {}
  }
}

/** تسجيل الدخول بحساب Google: طبقة أصلية على الجوال، ونافذة منبثقة على الويب */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')
  const auth = getCloudAuth()
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle()
    const idToken = result?.credential?.idToken
    if (idToken && !auth.currentUser) {
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
    }
    return normalizeUser(auth.currentUser || result?.user)
  }
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  return normalizeUser(result.user)
}

/** تسجيل الخروج من الطبقتين الأصلية وويب معاً */
export async function signOutUser() {
  if (!isFirebaseConfigured) return
  try {
    if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut()
  } catch (error) {
    console.warn('Mizan: native sign out failed', error)
  }
  try {
    await signOut(getCloudAuth())
  } catch (error) {
    console.warn('Mizan: web sign out failed', error)
  }
}

/** قراءة نسخة المستخدم من Firestore */
export async function loadRemote(uid) {
  if (!isFirebaseConfigured || !uid) return null
  const snapshot = await getDoc(stateDoc(uid))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  if (!data?.mizan) return null
  const updatedAt = Number(data.updatedAt) || 0
  return { state: { ...data.mizan, updatedAt }, updatedAt }
}

/** كتابة نسخة المستخدم إلى Firestore */
export async function saveRemote(uid, state, updatedAt) {
  if (!isFirebaseConfigured || !uid) return
  await setDoc(
    stateDoc(uid),
    { mizan: state, updatedAt, version: 1 },
    { merge: true },
  )
}

/** متابعة تغييرات السحابة من جهاز آخر */
export function subscribeRemote(uid, callback) {
  if (!isFirebaseConfigured || !uid) return () => {}
  return onSnapshot(
    stateDoc(uid),
    (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.data()
      if (!data?.mizan) return
      const updatedAt = Number(data.updatedAt) || 0
      callback({ state: { ...data.mizan, updatedAt }, updatedAt })
    },
    (error) => console.warn('Mizan: remote listener failed', error),
  )
}
