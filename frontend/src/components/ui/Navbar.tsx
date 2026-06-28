'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { Menu, X, Coins, User as UserIcon, LogOut, LayoutDashboard, PlusCircle, Gamepad2, MessageSquare } from 'lucide-react';
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
    { href: '/tournaments', label: 'Турниры', icon: <Gamepad2 className="w-4 h-4" /> },
    { href: '/friends', label: 'Друзья', icon: <UserIcon className="w-4 h-4" /> },
    { href: '/chat', label: 'Чат', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  if (isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin')) {
    navLinks.push({ href: '/create', label: 'Создать', icon: <PlusCircle className="w-4 h-4" /> });
  }

  if (isAuthenticated) {
    navLinks.push({ href: '/dashboard', label: 'Кабинет', icon: <LayoutDashboard className="w-4 h-4" /> });
  }

  return (
    <nav className="sticky top-0 w-full z-40 bg-arena-dark/80 backdrop-blur-md border-b border-arena-border">
      {/* Decorative top border line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-neon-purple/50 via-neon-blue/50 to-neon-purple/50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-orbitron font-extrabold text-lg text-white tracking-widest hover:opacity-90">
              <span className="text-neon-purple neon-text-purple">⚡</span>
              <span>UNDERGROUND</span>
              <span className="text-neon-blue neon-text-blue hidden sm:inline">ARENA</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 font-orbitron text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'text-neon-purple neon-text-purple'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section: Auth and Balance */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* Balance display */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-gold/10 border border-neon-gold/30 text-neon-gold shadow-neon-gold/10">
                  <Coins className="w-4 h-4 animate-spin-slow" />
                  <span className="font-orbitron font-extrabold text-sm">{Number(user.credits).toLocaleString()}</span>
                  <span className="text-[9px] font-bold uppercase">CR</span>
                </div>

                {/* Profile link */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-neon-purple/50 overflow-hidden bg-arena-card flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-neon-purple" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white max-w-[100px] truncate">{user.username}</span>
                    <span className="text-[8px] font-bold uppercase text-gray-400 font-orbitron">{user.role}</span>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-neon-red hover:bg-neon-red/10 transition-all"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm">Войти</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Регистрация</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {isAuthenticated && user && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neon-gold/10 border border-neon-gold/30 text-neon-gold mr-3">
                <Coins className="w-3.5 h-3.5" />
                <span className="font-orbitron font-extrabold text-xs">{Number(user.credits).toLocaleString()}</span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-arena-card border-t border-arena-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md font-orbitron text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/5 hover:text-white"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md font-orbitron text-xs font-bold uppercase tracking-wider text-neon-red hover:bg-neon-red/5"
              >
                <LogOut className="w-4 h-4" /> Выйти
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-4 px-3">
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Войти</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Регистрация</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
