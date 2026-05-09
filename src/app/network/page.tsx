"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Mail, Link2, ExternalLink } from "lucide-react";

const networkData = [
  {
    company: "Figma",
    contacts: [
      { name: "Sarah Chen", title: "VP of Operations", email: "s.chen@figma.com", warmth: "cold" },
      { name: "Mike Rodriguez", title: "Director, Strategy", email: null, warmth: "cold" },
    ],
  },
  {
    company: "Notion",
    contacts: [
      { name: "Alex Kim", title: "Chief of Staff", email: "akim@notion.so", warmth: "warm" },
      { name: "Rachel Wu", title: "Head of People", email: null, warmth: "cold" },
    ],
  },
  {
    company: "Ramp",
    contacts: [
      { name: "Jordan Lee", title: "VP Revenue Operations", email: "jlee@ramp.com", warmth: "cold" },
    ],
  },
];

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Network Map</h2>
        <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
          <Users className="h-3 w-3 mr-1" />
          {networkData.reduce((sum, c) => sum + c.contacts.length, 0)} contacts
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {networkData.map((company) => (
          <Card key={company.company} className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">{company.company}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {company.contacts.map((contact) => (
                <div key={contact.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="text-sm text-white">{contact.name}</p>
                    <p className="text-xs text-white/40">{contact.title}</p>
                  </div>
                  <div className="flex gap-1">
                    {contact.email && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/30 hover:text-white">
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/30 hover:text-white">
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
