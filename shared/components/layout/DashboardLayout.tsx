"use client";

import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  title: string;
  subtitle: string;
  userRole: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  menuItems,
  title,
  subtitle,
  userRole,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      {/* Simplified background for better performance */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02]" />
      
      <div className="relative z-10 flex w-full">
        {/* Sidebar */}
        <Sidebar
          menuItems={menuItems}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            title={title}
            subtitle={subtitle}
            userRole={userRole}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          
          {/* Page Content with enhanced styling */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50/50 via-transparent to-blue-50/30 p-6 backdrop-blur-sm">
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
      
    </div>
  );
};
