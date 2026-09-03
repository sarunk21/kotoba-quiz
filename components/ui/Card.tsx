'use client'

import type { ReactNode } from 'react'

type CardProps = {
 children: ReactNode
 className?: string
 padding?: 'sm' | 'md' | 'lg'
 rounded?: 'sm' | 'md' | 'lg' | 'xl'
 shadow?: 'card' | 'elevated' | 'float' | 'none'
 anim?: string
 as?: 'div' | 'section'
}

const paddingMap = {
 sm: 'p-4',
 md: 'p-5',
 lg: 'p-6 sm:p-8',
}
const roundedMap = {
 sm: 'rounded-[var(--radius-sm)]',
 md: 'rounded-[var(--radius-md)]',
 lg: 'rounded-[var(--radius-lg)]',
 xl: 'rounded-[var(--radius-xl)]',
}
const shadowMap = {
 card: 'shadow-card',
 elevated: 'shadow-elevated',
 float: 'shadow-float',
 none: '',
}

export function Card({ children, className = '', padding = 'md', rounded = 'lg', shadow = 'card', anim, as = 'div' }: CardProps) {
 const Tag = as
 return (
 <Tag className={`bg-[var(--color-surface)] border border-[var(--color-border-light)] ${roundedMap[rounded]} ${shadowMap[shadow]} ${paddingMap[padding]} ${anim ?? ''} ${className}`.trim()}>
 {children}
 </Tag>
 )
}
