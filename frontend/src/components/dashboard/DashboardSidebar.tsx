"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Layers, Palette, Clock, Settings, X, UserCircle, Users, KanbanSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useUiStore } from "@/store/uiStore";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, setSidebarCollapsed } = useUiStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Documents", href: "/dashboard/documents", icon: FileText },
    { name: "Find Students", href: "/dashboard/students", icon: Users },
    { name: "Pipeline", href: "/dashboard/pipeline", icon: KanbanSquare },
    { name: "Templates", href: "/dashboard/templates", icon: Layers },
    { name: "Recent Edits", href: "/dashboard/recent", icon: Clock },
  ];

  const bottomNavigation = [
    { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Prevent hydration mismatch by rendering a static un-animated version first
  if (!isMounted) {
    return (
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed top-0 left-0 border-r border-slate-200 bg-white z-40"></aside>
    );
  }

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 88 : 280,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`flex flex-col h-screen fixed top-0 left-0 border-r border-slate-200 bg-white z-50 overflow-visible ${
          isSidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}
      >
        
        {/* Logo Section */}
        <div className="h-[88px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <Link href="/dashboard" className="block w-full overflow-hidden flex items-center h-full">
            <motion.div animate={{ opacity: isSidebarCollapsed ? 0 : 1 }} transition={{ duration: 0.2 }}>
              {!isSidebarCollapsed && (
                <Image src="/studlyf.png" alt="Studlyf Logo" width={120} height={32} className="h-7 w-auto object-contain min-w-[120px]" priority />
              )}
            </motion.div>
            {isSidebarCollapsed && (
              <div className="absolute left-0 w-full flex justify-center">
                <Image src="/stud.png" alt="Studlyf Icon" width={32} height={32} className="w-8 h-8 object-contain" priority />
              </div>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          {!isSidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 whitespace-nowrap">
              Overview
            </div>
          )}
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg text-sm font-semibold transition-all group relative ${
                  isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                } ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon 
                  className={`shrink-0 transition-colors ${
                    isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                  } ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`} 
                />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                
                {/* CSS Tooltip for Collapsed State */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg text-sm font-semibold transition-all group relative ${
                  isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                } ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon 
                  className={`shrink-0 transition-colors ${
                    isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                  } ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`} 
                />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}

                {/* CSS Tooltip for Collapsed State */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

      </motion.aside>
    </>
  );
}
