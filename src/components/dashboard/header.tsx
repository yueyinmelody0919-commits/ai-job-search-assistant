"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Command } from "lucide-react";

export function Header() {
  const [autopilot, setAutopilot] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-loud">
          Good morning, Melody
        </h2>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Manual</span>
          <Switch
            checked={autopilot}
            onCheckedChange={setAutopilot}
            className="data-[state=checked]:bg-rose"
          />
          <span className={`text-xs ${autopilot ? "text-rose font-medium" : "text-muted-foreground"}`}>
            Autopilot
          </span>
          {autopilot && (
            <Badge className="bg-elevated text-rose text-[10px] border border-rose/20">
              85+ auto-queued
            </Badge>
          )}
        </div>

        <Button variant="outline" size="sm"
          className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose hover:border-rose/30">
          <Command className="h-3 w-3" /><span>K</span>
        </Button>

        <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-rose">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose" />
        </Button>
      </div>
    </header>
  );
}
