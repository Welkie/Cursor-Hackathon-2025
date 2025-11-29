'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className={`relative z-50 w-full ${sizeClasses[size]} rounded-lg shadow-2xl border border-border animate-slide-up my-auto max-h-[90vh] flex flex-col modal-content`}
        style={{
          backgroundColor: 'hsl(var(--card))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex items-center justify-between p-6 border-b border-border flex-shrink-0"
          style={{
            backgroundColor: 'hsl(var(--card))',
          }}
        >
          <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            style={{ color: 'hsl(var(--foreground))' }}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

