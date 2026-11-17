import React from 'react'
import { X, Check, Inbox } from 'lucide-react'

export function Card({ children, className = '', ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>
}

export function SectionHeader({ title, action, onAction, icon: Icon }) {
  return (
    <div className="section-head">
      <div className="section-head-title">
        {Icon && <span className="section-head-icon"><Icon size={16} strokeWidth={2.2} /></span>}
        <h3>{title}</h3>
      </div>
      {action && <button className="link-btn" onClick={onAction}>{action}</button>}
    </div>
  )
}

export function Pill({ children, tone = 'neutral', icon: Icon }) {
  return (
    <span className={`pill pill-${tone}`}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  )
}

export function ProgressBar({ value, max, color = 'var(--forest)', height = 8 }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function ProgressRing({ value, max, size = 62, stroke = 7, color = 'var(--gold)' }) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Modal({ title, subtitle, onClose, children, footer }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn ghost" onClick={onClose} aria-label="close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function Toast({ message, onDone }) {
  React.useEffect(() => {
    if (!message) return
    const id = setTimeout(onDone, 2800)
    return () => clearTimeout(id)
  }, [message, onDone])
  if (!message) return null
  return (
    <div className="toast" role="status">
      <span className="toast-check"><Check size={15} strokeWidth={3} /></span>
      {message}
    </div>
  )
}

export function EmptyState({ text, icon: Icon = Inbox }) {
  return (
    <div className="empty-state">
      <Icon size={26} strokeWidth={1.6} />
      <p>{text}</p>
    </div>
  )
}

export function IconButton({ icon: Icon, label, onClick, tone = 'ghost', badge }) {
  return (
    <button className={`icon-btn ${tone}`} onClick={onClick} aria-label={label} title={label}>
      <Icon size={18} strokeWidth={2} />
      {badge > 0 && <span className="icon-badge">{badge}</span>}
    </button>
  )
}
