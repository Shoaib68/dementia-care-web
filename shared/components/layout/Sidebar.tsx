"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut, AlertTriangle } from 'lucide-react';
import { Logo } from '@/shared/components/ui/Logo';
import { MenuItem } from './DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface SidebarProps {
  menuItems: MenuItem[];
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ menuItems, isOpen, onToggle }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openLogoutDialog = () => {
    setShowLogoutDialog(true);
  };

  return (
    <>
      {/* Subtle mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Soft, Eye-Friendly Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-white via-neutral-50 to-white backdrop-blur-xl border-r border-neutral-200/60 shadow-lg transform transition-all duration-500 ease-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Very subtle brand color hints */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/15 via-purple-50/8 to-green-50/15" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-teal-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-8 w-24 h-24 bg-gradient-to-r from-purple-100/20 to-green-100/20 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          {/* Professional, Subtle Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-neutral-200/60 bg-white/70 backdrop-blur-sm hover:bg-teal-50/30 transition-all duration-300 group">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Logo 
                  width={32} 
                  height={32} 
                  className="group-hover:rotate-12 transition-transform duration-300 drop-shadow-md" 
                />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-teal-600 via-purple-600 to-green-600 bg-clip-text text-transparent drop-shadow-sm group-hover:from-teal-700 group-hover:via-purple-700 group-hover:to-green-700 transition-all duration-300">
                  Dementia Care
                </h2>
                <p className="text-xs font-medium text-neutral-600 tracking-wide group-hover:text-neutral-700 transition-colors duration-300">Healthcare Platform</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden h-10 w-10 rounded-xl hover:bg-red-50 hover:shadow-md hover:shadow-red-500/10 hover:border-red-200/40 border border-transparent text-neutral-600 hover:text-red-600 transition-all duration-300 group"
            >
              <X className="h-5 w-5 group-hover:rotate-180 group-hover:scale-110 transition-all duration-300" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="mt-8 px-4">
            <div className="space-y-3">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                
                return (
                  <Link
                    key={item.path || `menu-item-${index}`}
                    href={item.path}
                    className={`
                      group relative flex items-center px-4 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5
                      ${isActive
                        ? 'bg-gradient-to-r from-teal-100/80 to-purple-100/80 text-teal-900 shadow-md shadow-teal-500/25 border border-teal-300/60 hover:from-teal-100 hover:to-purple-100 hover:shadow-lg hover:shadow-teal-500/30'
                        : 'text-neutral-700 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-purple-50/50 hover:text-teal-800 hover:shadow-md hover:shadow-teal-500/10 backdrop-blur-sm border border-transparent hover:border-teal-200/30'
                      }
                    `}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full shadow-md group-hover:w-2 group-hover:shadow-lg transition-all duration-300" />
                    )}
                    
                    {/* Icon with subtle, professional styling */}
                    <div className={`
                      relative flex items-center justify-center w-8 h-8 rounded-xl mr-4 transition-all duration-300
                      ${isActive 
                        ? 'bg-teal-100/80 shadow-sm group-hover:bg-teal-200/80 group-hover:scale-110' 
                        : 'bg-neutral-100/60 group-hover:bg-gradient-to-br group-hover:from-teal-100/60 group-hover:to-purple-100/60 group-hover:scale-110 group-hover:shadow-sm'
                      }
                    `}>
                      <Icon className={`h-4 w-4 transition-all duration-300 ${
                        isActive 
                          ? 'text-teal-700 drop-shadow-sm group-hover:scale-110' 
                          : 'text-neutral-600 group-hover:text-teal-700 group-hover:scale-110'
                      }`} />
                      
                      {/* Subtle glow effect for active item */}
                      {isActive && (
                        <div className="absolute inset-0 bg-teal-100/20 rounded-xl blur-sm group-hover:bg-teal-200/30 group-hover:blur-md transition-all duration-300" />
                      )}
                    </div>
                    
                    <span className="relative z-10 tracking-wide group-hover:tracking-wider transition-all duration-300">{item.label}</span>
                    
                    {/* Subtle animation indicator */}
                    <div className={`
                      absolute right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 group-hover:scale-110
                      ${isActive ? 'opacity-100' : ''}
                    `}>
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'bg-teal-500/60 animate-pulse group-hover:bg-teal-500/80 group-hover:shadow-md group-hover:shadow-teal-500/30' 
                          : 'bg-neutral-400/60 group-hover:bg-teal-500/60 group-hover:shadow-md group-hover:shadow-teal-500/20'
                      }`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
        
        {/* Professional Logout Section - Bottom Position */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-white/70 backdrop-blur-sm border-t border-neutral-200/60 shadow-md hover:bg-red-50/80 hover:border-red-200/60 transition-all duration-300">
            <Button
              onClick={openLogoutDialog}
              className="group w-full bg-transparent hover:bg-gradient-to-r hover:from-red-50/60 hover:to-red-100/60 text-neutral-600 hover:text-red-700 border-0 px-6 py-4 transition-all duration-300 font-medium flex items-center justify-center space-x-3 hover:shadow-sm hover:shadow-red-500/10"
            >
              <LogOut className="h-4 w-4 group-hover:rotate-12 group-hover:scale-110 group-hover:text-red-600 transition-all duration-300" />
              <span className="group-hover:tracking-wider transition-all duration-300">Logout</span>
            </Button>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="border border-neutral-200 bg-white text-neutral-900 shadow-xl shadow-neutral-900/10">
            <AlertDialogHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle className="text-lg font-semibold text-neutral-900">
                  Confirm Logout
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-neutral-600">
                Are you sure you want to log out? You will need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 mt-4">
              <AlertDialogCancel 
                onClick={() => setShowLogoutDialog(false)}
                className="bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 transition-all duration-200"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white border-0 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};
