"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Mail, Link2, ExternalLink, Search, Building2, Loader2 } from "lucide-react";

interface Contact {
  name: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  company: string;
}

interface CompanyContacts {
  company: string;
  contacts: Contact[];
}

// Demo data (replaced by real API calls when Apollo key is configured)
const demoData: CompanyContacts[] = [
  {
    company: "Figma",
    contacts: [
      { name: "Sarah Chen", title: "VP of Operations", email: "s.chen@figma.com", linkedinUrl: null, company: "Figma" },
      { name: "Mike Rodriguez", title: "Director, Strategy", email: null, linkedinUrl: "https://linkedin.com/in/mrodriguez", company: "Figma" },
    ],
  },
  {
    company: "Notion",
    contacts: [
      { name: "Alex Kim", title: "Chief of Staff", email: "akim@notion.so", linkedinUrl: null, company: "Notion" },
      { name: "Rachel Wu", title: "Head of People", email: null, linkedinUrl: "https://linkedin.com/in/rachelwu", company: "Notion" },
    ],
  },
  {
    company: "Ramp",
    contacts: [
      { name: "Jordan Lee", title: "VP Revenue Operations", email: "jlee@ramp.com", linkedinUrl: null, company: "Ramp" },
    ],
  },
];

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyContacts[]>(demoData);
  const [loading, setLoading] = useState(false);

  async function lookupCompany() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/network?company=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.contacts && data.contacts.length > 0) {
        setCompanies((prev) => {
          const existing = prev.find((c) => c.company.toLowerCase() === searchQuery.toLowerCase());
          if (existing) return prev;
          return [...prev, { company: searchQuery, contacts: data.contacts }];
        });
      }
    } catch {
      // Silently fail, keep demo data
    }
    setLoading(false);
    setSearchQuery("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Network Map</h2>
        <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
          <Users className="h-3 w-3 mr-1" />
          {companies.reduce((sum, c) => sum + c.contacts.length, 0)} contacts
        </Badge>
      </div>

      {/* Company lookup */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Look up contacts at a company (e.g., Figma)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupCompany()}
            className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
          />
        </div>
        <Button onClick={lookupCompany} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Company cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.company} className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white">{company.company}</CardTitle>
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">
                  {company.contacts.length} contacts
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {company.contacts.map((contact) => (
                <div key={contact.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{contact.name}</p>
                    <p className="text-xs text-white/40 truncate">{contact.title}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {contact.email && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/30 hover:text-blue-400"
                        title={`Email ${contact.name}`}>
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {contact.linkedinUrl && (
                      <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/30 hover:text-blue-400"
                          title="View LinkedIn">
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/30 hover:text-green-400"
                      title="Draft intro email">
                      <ExternalLink className="h-3.5 w-3.5" />
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
