import React from 'react'
import { ArrowLeft, Cloud, ShieldCheck } from 'lucide-react'
import { Segmented } from './UI'

const GOOGLE_ICON = (
  <svg viewBox="0 0 48 48" aria-hidden="true" width="18" height="18">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.86.93 7.52 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

/** أول فتح للتطبيق: دعوة لتسجيل الدخول بحساب Google مع إمكانية المتابعة محلياً */
export default function AuthScreen({ t, lang, onLang, onSignIn, onContinue, busy, error }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-top">
          <Segmented
            className="auth-lang"
            options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'EN' }]}
            value={lang}
            onChange={onLang}
          />
        </div>

        <div className="auth-mark">
          <img src="/mizan-mark.svg" alt="" />
        </div>
        <h1>{t('auth.title')}</h1>
        <p className="auth-subtitle">{t('auth.subtitle')}</p>

        <div className="auth-features">
          <span><Cloud size={15} /> {t('auth.featureSync')}</span>
          <span><ShieldCheck size={15} /> {t('auth.featurePrivate')}</span>
        </div>

        <button className="auth-google" onClick={onSignIn} disabled={busy}>
          {GOOGLE_ICON}
          <span>{busy ? t('auth.loading') : t('auth.signIn')}</span>
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="auth-divider"><span>{t('auth.or')}</span></div>

        <button className="auth-local" onClick={onContinue} disabled={busy}>
          {t('auth.local')} <ArrowLeft size={15} />
        </button>
        <p className="auth-note">{t('auth.note')}</p>
      </div>
    </div>
  )
}
