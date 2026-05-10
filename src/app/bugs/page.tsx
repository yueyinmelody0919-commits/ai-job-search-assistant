"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bug, Copy, Check, AlertTriangle, Clock, CheckCircle, XCircle, Loader2,
} from "lucide-react";

interface BugReport {
  id: number;
  title: string;
  description: string;
  reportedBy: string;
  severity: string;
  status: string;
  errorMessage: string | null;
  fixPrompt: string;
  createdAt: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-amber-600" />,
  fixed: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
  wont_fix: <XCircle className="h-3.5 w-3.5 text-dim" />,
};

const agentNames: Record<string, string> = {
  scout: "Dwight", analyst: "Oscar", strategist: "Jim", ops: "Angela",
  engineer: "Darryl", coach: "Holly", qa: "Stanley", system: "System",
};

function toNYC(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: "America/New_York", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyingAll, setCopyingAll] = useState(false);
  const [expandedBug, setExpandedBug] = useState<number | null>(null);

  const fetchBugs = useCallback(async () => {
    try {
      const res = await fetch("/api/bugs");
      const data = await res.json();
      setBugs(data.bugs || []);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchBugs().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fetchBugs]);

  async function copyAllPrompts() {
    setCopyingAll(true);
    try {
      const res = await fetch("/api/bugs?prompts=true");
      const data = await res.json();
      await navigator.clipboard.writeText(data.prompts);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
    setCopyingAll(false);
  }

  async function copySinglePrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateStatus(bugId: number, status: string) {
    await fetch("/api/bugs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bugId, status }),
    });
    fetchBugs();
  }

  const openBugs = bugs.filter(b => b.status === "open");
  const inProgressBugs = bugs.filter(b => b.status === "in_progress");
  const fixedBugs = bugs.filter(b => b.status === "fixed" || b.status === "wont_fix");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug className="h-5 w-5 text-destructive" />
          <h2 className="text-sm font-semibold text-loud">Bug Reports</h2>
          {openBugs.length > 0 && (
            <Badge variant="outline" className="border-destructive/20 text-destructive text-xs">
              {openBugs.length} open
            </Badge>
          )}
        </div>

        {openBugs.length > 0 && (
          <Button
            onClick={copyAllPrompts}
            disabled={copyingAll}
            className="bg-rose text-primary-foreground hover:bg-rose/90"
          >
            {copied ? (
              <><Check className="h-4 w-4 mr-2" /> Copied!</>
            ) : copyingAll ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copy All Fix Prompts</>
            )}
          </Button>
        )}
      </div>

      {bugs.length === 0 && (
        <Card className="bg-background border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-8 w-8 text-emerald-600/50 mb-3" />
            <p className="text-sm text-muted-foreground">No bugs reported. Stanley is pleased.</p>
          </CardContent>
        </Card>
      )}

      {/* Open Bugs */}
      {openBugs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open ({openBugs.length})</h3>
          {openBugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} expanded={expandedBug === bug.id}
              onToggle={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              onCopyPrompt={copySinglePrompt} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}

      {inProgressBugs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Progress ({inProgressBugs.length})</h3>
          {inProgressBugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} expanded={expandedBug === bug.id}
              onToggle={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              onCopyPrompt={copySinglePrompt} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}

      {fixedBugs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved ({fixedBugs.length})</h3>
          {fixedBugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} expanded={expandedBug === bug.id}
              onToggle={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              onCopyPrompt={copySinglePrompt} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function BugCard({
  bug, expanded, onToggle, onCopyPrompt, onUpdateStatus,
}: {
  bug: BugReport; expanded: boolean; onToggle: () => void;
  onCopyPrompt: (prompt: string) => void; onUpdateStatus: (id: number, status: string) => void;
}) {
  return (
    <Card className="bg-background border border-border overflow-hidden">
      <CardContent className="p-0">
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-elevated transition-colors"
          onClick={onToggle}
        >
          {statusIcons[bug.status]}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-loud">{bug.title}</span>
              <Badge variant="outline" className={`text-[10px] ${severityColors[bug.severity]}`}>
                {bug.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reported by {agentNames[bug.reportedBy] || bug.reportedBy} · <span className="font-mono">{toNYC(bug.createdAt)}</span>
            </p>
          </div>
          <Button
            size="sm" variant="ghost"
            className="text-rose-dim hover:text-rose hover:bg-blue-50"
            onClick={(e) => { e.stopPropagation(); onCopyPrompt(bug.fixPrompt); }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy Fix Prompt
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-border p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{bug.description}</p>
            </div>

            {bug.errorMessage && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Error</p>
                <pre className="text-xs text-red-600 bg-red-50 rounded-lg p-3 border border-red-200 overflow-x-auto font-mono">
                  {bug.errorMessage}
                </pre>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1">Fix Prompt (for Claude Code)</p>
              <pre className="text-xs text-muted-foreground bg-elevated rounded-lg p-3 border border-border overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                {bug.fixPrompt}
              </pre>
            </div>

            <div className="flex gap-2">
              {bug.status === "open" && (
                <Button size="sm" variant="outline" onClick={() => onUpdateStatus(bug.id, "in_progress")}>
                  Mark In Progress
                </Button>
              )}
              {(bug.status === "open" || bug.status === "in_progress") && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onUpdateStatus(bug.id, "fixed")}>
                  Mark Fixed
                </Button>
              )}
              {bug.status !== "wont_fix" && bug.status !== "fixed" && (
                <Button size="sm" variant="ghost" className="text-muted-foreground"
                  onClick={() => onUpdateStatus(bug.id, "wont_fix")}>
                  Won&apos;t Fix
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
