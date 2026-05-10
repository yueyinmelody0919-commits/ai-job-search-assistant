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
    <div className="hidden md:flex md:w-56 md:flex-col">
      <div className="flex flex-1 flex-col border-r border-border bg-background">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0C5BBE] to-[#0F72EE] text-white text-[10px] font-semibold tracking-wider">
            AI
          </div>
          <div>
            <h1 className="text-sm font-semibold text-loud">AI Colleagues</h1>
            <p className="text-[10px] text-muted-foreground">Dunder Mifflin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-elevated text-rose"
                    : "text-foreground hover:bg-surface hover:text-rose"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-rose"
                      : "text-dim group-hover:text-rose"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Agent status footer */}
        <div className="border-t border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">7 agents online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
