"use client";

import React from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/store/authStore';
interface HeaderProps {
  title: string;
  subtitle: string;
  userRole: string;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, userRole, onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="relative bg-gradient-to-br from-neutral-50 via-white to-neutral-100 backdrop-blur-sm border-b border-neutral-200/60 shadow-sm">
      {/* Subtle brand color hints - very light */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-50/20 via-purple-50/10 to-green-50/20" />
      
      <div className="relative flex items-center justify-between px-6 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-teal-50 text-neutral-600 hover:text-teal-700 transition-all duration-200 rounded-xl border border-transparent hover:border-teal-200/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 via-purple-600 to-green-600 bg-clip-text text-transparent drop-shadow-sm">
              {title}
            </h1>
            <p className="text-sm font-medium text-neutral-600 tracking-wide">{subtitle}</p>
          </div>
        </div>

        {/* Right section - Simplified user info only */}
        <div className="flex items-center">
          {/* User info with subtle, professional design */}
          <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-neutral-200/60 shadow-sm hover:shadow-md hover:shadow-teal-500/10 hover:bg-teal-50/50 hover:border-teal-300/60 hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="relative">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:from-teal-400 group-hover:to-purple-500 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-teal-500/30 transition-all duration-300">
                <User className="h-4 w-4 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm group-hover:from-green-300 group-hover:to-emerald-400 group-hover:scale-125 group-hover:shadow-md group-hover:shadow-green-400/40 transition-all duration-300" />
            </div>
            <div className="hidden sm:block text-sm space-y-0.5">
              <p className="font-semibold text-neutral-900 leading-tight group-hover:text-teal-900 transition-colors duration-300">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs font-medium text-neutral-600 bg-gradient-to-r from-teal-100/60 to-purple-100/60 px-2 py-0.5 rounded-md group-hover:from-teal-200/60 group-hover:to-purple-200/60 group-hover:text-neutral-700 group-hover:scale-105 transition-all duration-300">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
