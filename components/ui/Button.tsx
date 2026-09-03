'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'accent-light'
type Size = 'sm' | 'md' | 'lg'

const variantMap: Record<Variant, string> = {
 primary: 'bg-[var(--color-accent)] text-white shadow-elevated hover:bg-[var(--color-accent-hover)]',
 ghost: 'bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]',
 danger: 'bg-[var(--color-red-light)] text-[var(--color-red)] border border-[var(--color-border)] hover:bg-[var(--color-red)] hover:text-white',
 'accent-light': 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]',
}

const sizeMap: Record<Size, string> = {
 sm: 'px-3 py-2 text-xs font-extrabold rounded-[var(--radius-sm)]',
 md: 'px-6 py-3 text-sm font-extrabold rounded-[var(--radius-md)]',
 lg: 'px-6 py-3.5 text-sm font-extrabold rounded-[var(--radius-md)]',
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: { variant?: Variant; size?: Size; children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
 return (
 <button
 className={`active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none ${variantMap[variant]} ${sizeMap[size]} ${className}`.trim()}
 {...props}
 >
 {children}
 </button>
 )
}
