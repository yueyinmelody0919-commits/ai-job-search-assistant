"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  Mail,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Bot,
  Search,
  BarChart3,
  Pen,
} from "lucide-react";

const stats = [
  { label: "Jobs Discovered", value: "47", change: "+12 this week", icon: Search, color: "text-blue-400" },
  { label: "Scored", value: "38", change: "6 pending", icon: BarChart3, color: "text-purple-400" },
  { label: "Outreached", value: "8", change: "3 replies", icon: Mail, color: "text-green-400" },
  { label: "Interviews", value: "2", change: "1 this week", icon: Briefcase, color: "text-amber-400" },
];

const approvalQueue = [
  { id: 1, type: "email", company: "Figma", title: "Director, Strategy & Ops", score: 94, action: "Outreach email drafted by Jim", urgent: true },
  { id: 2, type: "email", company: "Notion", title: "Head of Business Operations", score: 91, action: "Follow-up email (no reply in 5 days)", urgent: false },
  { id: 3, type: "review", company: "Ramp", title: "VP, Revenue Operations", score: 88, action: "New job — review and approve outreach", urgent: false },
];

const agentActivity = [
  { agent: "Dwight", action: "Found 3 new Director-level roles matching your criteria", time: "2m ago", emoji: "🔍" },
  { agent: "Oscar", action: "Scored Figma role: 94/100 — strong AI-native culture fit", time: "5m ago", emoji: "📊" },
  { agent: "Jim", action: "Drafted outreach email for Figma VP of Product", time: "8m ago", emoji: "✉️" },
  { agent: "Angela", action: "Follow-up with Notion is overdue. Moved to URGENT.", time: "15m ago", emoji: "⏰" },
  { agent: "Darryl", action: "Yo, I added salary comparison charts to the feed view", time: "1h ago", emoji: "🛠️" },
  { agent: "Holly", action: "Found a great course on AI agent architectures for you!", time: "2h ago", emoji: "📚" },
  { agent: "Stanley", action: "Fixed the scoring timeout bug. Can I go home now?", time: "3h ago", emoji: "🐛" },
];

const hotCompanies = [
  { name: "Figma", signal: "Hiring 3 S&O roles", score: 94 },
  { name: "Ramp", signal: "Series D, $300M raised", score: 88 },
  { name: "Notion", signal: "New CoS to CEO opening", score: 91 },
  { name: "Anthropic", signal: "AI-native, rapid growth", score: 86 },
  { name: "Scale AI", signal: "GTM expansion, NYC office", score: 83 },
];

export default function MorningBrief() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.change}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approval Queue */}
        <div className="lg:col-span-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white">Approval Queue</CardTitle>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
                  {approvalQueue.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvalQueue.map((item) => (
                <div key={item.id} className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.score >= 90 ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                      <span className="text-sm font-bold">{item.score}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{item.company}</span>
                        <span className="text-xs text-white/40">{item.title}</span>
                        {item.urgent && (
                          <Badge className="bg-red-500/20 text-red-300 text-[10px] border-red-500/30">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">{item.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="ghost" className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-white/40 hover:text-white hover:bg-white/10">
                      <Pen className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Agent Activity Feed */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-400" />
              Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              <div className="space-y-3">
                {agentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.03]">
                    <span className="text-lg">{activity.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80">
                        <span className="font-medium text-white">{activity.agent}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Hot Companies */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Market Pulse — Hot Companies This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {hotCompanies.map((company) => (
              <div key={company.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05] cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">{company.name}</p>
                  <p className="text-[10px] text-white/40">{company.signal}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${company.score >= 90 ? "border-green-500/30 text-green-400" : "border-blue-500/30 text-blue-400"}`}>
                  {company.score}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
