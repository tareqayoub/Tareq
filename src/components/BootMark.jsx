import React from 'react'

const SPARKS = [
  { a: -90, d: 0 },
  { a: -30, d: 0.08 },
  { a: 30, d: 0.16 },
  { a: 90, d: 0.04 },
  { a: 150, d: 0.13 },
  { a: 210, d: 0.2 },
]

/**
 * علامة ميزان تُرسم خطوطها تباعاً، ثم يميل الميزان ويستقر مع شرر ولمعان.
 * pathLength=1 يسمح بتحريك الحدّ بـ stroke-dashoffset دون حساب أطوال المسارات.
 */
export default function BootMark() {
  return (
    <div className="boot-mark">
      <span className="boot-glow" aria-hidden="true" />
      <span className="boot-halo" aria-hidden="true" />
      <span className="boot-ring" aria-hidden="true" />
      <span className="boot-shine-wrap" aria-hidden="true"><span className="boot-shine" /></span>
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="bm-spark"
          style={{ '--a': `${s.a}deg`, '--d': `${s.d}s` }}
          aria-hidden="true"
        />
      ))}

      <svg className="boot-svg" viewBox="0 0 512 512" aria-hidden="true">
        <path
          className="bm-draw bm-post" d="M 256 178 L 256 354"
          fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" pathLength="1"
        />

        <g className="bm-scale" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path className="bm-draw bm-beam" d="M 148 178 Q 256 154 364 178" strokeWidth="18" pathLength="1" />
          <path className="bm-draw bm-string" d="M 156 180 L 156 250" strokeWidth="6" pathLength="1" />
          <path className="bm-draw bm-string" d="M 356 180 L 356 250" strokeWidth="6" pathLength="1" />
          <path className="bm-draw bm-rim" d="M 106 250 L 206 250" strokeWidth="9" pathLength="1" />
          <path className="bm-draw bm-rim" d="M 306 250 L 406 250" strokeWidth="9" pathLength="1" />
          <g fill="currentColor" stroke="none">
            <path className="bm-fill bm-pan" d="M 112 252 L 200 252 Q 156 296 112 252 Z" />
            <path className="bm-fill bm-pan" d="M 312 252 L 400 252 Q 356 296 312 252 Z" />
          </g>
        </g>

        <g fill="currentColor">
          <circle className="bm-fill bm-knob" cx="256" cy="138" r="15" />
          <rect className="bm-fill bm-base" x="204" y="354" width="104" height="18" rx="9" />
          <rect className="bm-fill bm-base bm-base-last" x="184" y="376" width="144" height="15" rx="7.5" />
        </g>
      </svg>
    </div>
  )
}
