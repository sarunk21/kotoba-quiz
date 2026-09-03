export function IconHome({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
 <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
 </svg>
 )
}

export function IconBook({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 )
}

export function IconBolt({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
 <path d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 )
}

export function IconSettings({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="3" />
 <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
 </svg>
 )
}

export function IconTarget({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
 <circle cx="12" cy="12" r="10" />
 <circle cx="12" cy="12" r="3" fill="currentColor" />
 </svg>
 )
}

export function IconClose({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M18 6L6 18M6 6l12 12" />
 </svg>
 )
}

export function IconBack({ size = 18 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M15 18l-6-6 6-6" />
 </svg>
 )
}

export function IconChevronRight({ size = 18 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M9 18l6-6-6-6" />
 </svg>
 )
}

export function IconVolume({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
 <path d="M15.54 8.46a5 5 0 010 7.07" />
 <path d="M19.07 4.93a10 10 0 010 14.14" />
 </svg>
 )
}

export function IconSlowMo({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
 <circle cx="17" cy="17" r="3" />
 <path d="M17 13v-1M17 22v-1M13 17h-1M22 17h-1M14.5 14.5l-.7-.7M20.2 20.2l-.7-.7M14.5 19.5l-.7.7M20.2 13.8l-.7.7" opacity="0" />
 <path d="M17 14.5V17l1.5 1.5" />
 </svg>
 )
}

export function IconHeartFilled({ size = 18 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
 <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
 </svg>
 )
}

export function IconCheckCircle({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 )
}

export function IconXCircle({ size = 20 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="9" />
 <path d="M15 9l-6 6M9 9l6 6" />
 </svg>
 )
}

export function IconWarning({ size = 22 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 )
}

export function IconPlus({ size = 18 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 4v16m8-8H4" />
 </svg>
 )
}

export function IconSearch({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="11" cy="11" r="8" />
 <path d="M21 21l-4.35-4.35" />
 </svg>
 )
}

export function IconLightbulb({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
 </svg>
 )
}

export function IconEye({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
 <circle cx="12" cy="12" r="3" />
 </svg>
 )
}

export function IconEyeOff({ size = 16 }: { size?: number }) {
 return (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
 <line x1="1" y1="1" x2="23" y2="23" />
 </svg>
 )
}
