'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Menu } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const { darkMode, toggleDarkMode } = useFinanceStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">$</span>
              </div>
              <span className="font-semibold text-lg hidden sm:inline">Finance App</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" pathname={pathname}>Dashboard</NavLink>
              <NavLink href="/transactions" pathname={pathname}>Transactions</NavLink>
              <NavLink href="/goals" pathname={pathname}>Goals</NavLink>
              <NavLink href="/subscriptions" pathname={pathname}>Subscriptions</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              <MobileNavLink href="/dashboard" pathname={pathname} onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink href="/transactions" pathname={pathname} onClick={() => setMobileMenuOpen(false)}>
                Transactions
              </MobileNavLink>
              <MobileNavLink href="/goals" pathname={pathname} onClick={() => setMobileMenuOpen(false)}>
                Goals
              </MobileNavLink>
              <MobileNavLink href="/subscriptions" pathname={pathname} onClick={() => setMobileMenuOpen(false)}>
                Subscriptions
              </MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  pathname,
  children,
  onClick,
}: {
  href: string
  pathname: string
  children: React.ReactNode
  onClick: () => void
}) {
  const isActive = pathname === href
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </Link>
  )
}

