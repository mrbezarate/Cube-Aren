'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { Menu, X, Coins, User, LogOut, LayoutDashboard, PlusCircle, Gamepad2, MessageSquare } from 'lucide-react';
import Button from './Button';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/tournaments', label: 'Турниры', icon: Gamepad2 },
    { href: '/community', label: 'Сообщество', icon: MessageSquare },
  ];

  if (isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin')) {
    navLinks.push({ href: '/create', label: 'Создать', icon: PlusCircle });
  }

  if (isAuthenticated) {
    navLinks.push({ href: '/dashboard', label: 'Кабинет', icon: LayoutDashboard });
  }

  return (
    <nav className="sticky top-0 w-full z-50 bg-[#0c0c0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="font-semibold text-lg text-white hidden sm:block">Underground</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-bg-tertiary text-white'
                      : 'text-text-secondary hover:text-white hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* Balance */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-white/[0.06]">
                  <Coins className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium text-sm text-white">{Number(user.credits).toLocaleString()}</span>
                  <span className="text-xs text-text-tertiary">CR</span>
                </div>

                {/* Profile */}
                <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:bg-bg-tertiary rounded-lg p-2 -m-2 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-bg-elevated overflow-hidden flex items-center justify-center border border-white/[0.06]">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-text-tertiary" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-white max-w-[100px] truncate">{user.username}</span>
                    <span className="text-xs text-text-tertiary">{user.role}</span>
                  </div>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-text-tertiary hover:text-white hover:bg-bg-tertiary transition-colors"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Войти</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Регистрация</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-bg-secondary border-t border-white/[0.06]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-bg-tertiary text-white'
                      : 'text-text-secondary hover:text-white hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
          
          {!isAuthenticated && (
            <div className="px-4 py-3 border-t border-white/[0.06] space-y-2">
              <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                <Button variant="secondary" className="w-full">Войти</Button>
              </Link>
              <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full">Регистрация</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
