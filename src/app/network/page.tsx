"use client";

import { useState, useEffect } from "react";
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

// No mock data — only real contacts from Apollo lookups

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyContacts[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/network")
      .then(r => r.json())
      .then(data => {
        if (data.contacts && typeof data.contacts === "object") {
          const loaded = Object.entries(data.contacts).map(([company, contacts]) => ({
            company,
            contacts: contacts as Contact[],
          }));
          if (loaded.length > 0) setCompanies(loaded);
        }
      })
      .catch(() => {});
  }, []);

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
    } catch { /* */ }
    setLoading(false);
    setSearchQuery("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-loud">Network Map</h2>
        <span className="text-xs text-muted-foreground font-mono">
          <Users className="h-3 w-3 inline mr-1" />
          {companies.reduce((sum, c) => sum + c.contacts.length, 0)} contacts
        </span>
      </div>

      {/* Company lookup */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
          <Input
            placeholder="Look up contacts at a company (e.g., Figma)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupCompany()}
            className="pl-10"
          />
        </div>
        <Button onClick={lookupCompany} disabled={loading} className="bg-rose text-primary-foreground hover:bg-rose/90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button variant="outline" disabled={loading} onClick={async () => {
          setLoading(true);
          try {
            const res = await fetch("/api/network", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "batch_from_jobs", minScore: 80 }),
            });
            const data = await res.json();
            const found = data.results?.filter((r: { status: string }) => r.status === "found").length || 0;
            if (found > 0) {
              // Refresh contacts
              const refresh = await fetch("/api/network");
              const refreshData = await refresh.json();
              if (refreshData.contacts && typeof refreshData.contacts === "object") {
                const loaded = Object.entries(refreshData.contacts).map(([company, contacts]) => ({
                  company, contacts: contacts as Contact[],
                }));
                setCompanies(loaded);
              }
            }
            alert(`Populated ${found} companies from top-scored jobs`);
          } catch { alert("Batch population failed"); }
          setLoading(false);
        }}>
          Populate from Top Jobs
        </Button>
      </div>

      {/* Company cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.company} className="bg-background border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-loud">{company.company}</CardTitle>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {company.contacts.length} contacts
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {company.contacts.map((contact) => (
                <div key={contact.name} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:bg-elevated">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-loud truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {contact.email && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-dim hover:text-rose"
                        title={`Email ${contact.name}`}>
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {contact.linkedinUrl && (
                      <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-dim hover:text-rose"
                          title="View LinkedIn">
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-dim hover:text-emerald-600"
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
