"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Command, Moon, Sun } from "lucide-react";

export function Header() {
  const [autopilot, setAutopilot] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-black/20 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white/90">
          Good morning, Melody
        </h2>
        <Badge
          variant="outline"
          className="border-white/20 text-white/60 text-xs"
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {/* Autopilot toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Manual</span>
          <Switch
            checked={autopilot}
            onCheckedChange={setAutopilot}
            className="data-[state=checked]:bg-blue-500"
          />
          <span
            className={`text-xs ${autopilot ? "text-blue-400 font-medium" : "text-white/50"}`}
          >
            Autopilot
          </span>
          {autopilot && (
            <Badge className="bg-blue-500/20 text-blue-300 text-[10px] border-blue-500/30">
              85+ auto-queued
            </Badge>
          )}
        </div>

        {/* Cmd+K hint */}
        <Button
          variant="outline"
          size="sm"
          className="hidden lg:flex items-center gap-2 border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <Command className="h-3 w-3" />
          <span className="text-xs">K</span>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-white/50 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
}
