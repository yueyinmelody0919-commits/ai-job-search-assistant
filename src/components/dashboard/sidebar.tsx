"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Kanban,
  Bot,
  Network,
  Settings,
  GraduationCap,
  Bug,
  Zap,
} from "lucide-react";

const navigation = [
  { name: "Morning Brief", href: "/", icon: LayoutDashboard },
  { name: "Job Feed", href: "/feed", icon: Search },
  { name: "Pipeline", href: "/pipeline", icon: Kanban },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Network", href: "/network", icon: Network },
  { name: "Bugs", href: "/bugs", icon: Bug },
  { name: "Learning", href: "/learning", icon: GraduationCap },
  { name: "Preferences", href: "/preferences", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-1 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AI Colleagues</h1>
            <p className="text-[10px] text-white/50">Dunder Mifflin Branch</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/10 text-white shadow-sm shadow-white/5"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-blue-400"
                      : "text-white/40 group-hover:text-white/70"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Agent status footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/50">7 agents online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
