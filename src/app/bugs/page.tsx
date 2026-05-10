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
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  fixed: <CheckCircle className="h-3.5 w-3.5 text-green-400" />,
  wont_fix: <XCircle className="h-3.5 w-3.5 text-white/30" />,
};

const agentNames: Record<string, string> = {
  scout: "Dwight", analyst: "Oscar", strategist: "Jim", ops: "Angela",
  engineer: "Darryl", coach: "Holly", qa: "Stanley", system: "System",
};

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
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">Bug Reports</h2>
          {openBugs.length > 0 && (
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
              {openBugs.length} open
            </Badge>
          )}
        </div>

        {openBugs.length > 0 && (
          <Button
            onClick={copyAllPrompts}
            disabled={copyingAll}
            className="bg-blue-600 hover:bg-blue-700"
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
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-8 w-8 text-green-400/50 mb-3" />
            <p className="text-sm text-white/40">No bugs reported. Stanley is pleased.</p>
          </CardContent>
        </Card>
      )}

      {/* Open Bugs */}
      {openBugs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">Open ({openBugs.length})</h3>
          {openBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              expanded={expandedBug === bug.id}
              onToggle={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              onCopyPrompt={copySinglePrompt}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}

      {/* In Progress */}
      {inProgressBugs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">In Progress ({inProgressBugs.length})</h3>
          {inProgressBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              expanded={expandedBug === bug.id}
              onToggle={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              onCopyPrompt={copySinglePrompt}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}

      {/* Fixed */}
      {fixedBugs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">Resolved ({fixedBugs.length})</h3>
          {fixedBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              expanded={expandedBug === bug.id}
              onToggle={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
              onCopyPrompt={copySinglePrompt}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BugCard({
  bug,
  expanded,
  onToggle,
  onCopyPrompt,
  onUpdateStatus,
}: {
  bug: BugReport;
  expanded: boolean;
  onToggle: () => void;
  onCopyPrompt: (prompt: string) => void;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
          onClick={onToggle}
        >
          {statusIcons[bug.status]}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{bug.title}</span>
              <Badge variant="outline" className={`text-[10px] ${severityColors[bug.severity]}`}>
                {bug.severity}
              </Badge>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              Reported by {agentNames[bug.reportedBy] || bug.reportedBy} · {new Date(bug.createdAt).toLocaleString()}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={(e) => { e.stopPropagation(); onCopyPrompt(bug.fixPrompt); }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy Fix Prompt
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-white/5 p-4 space-y-4">
            <div>
              <p className="text-xs text-white/50 mb-1">Description</p>
              <p className="text-sm text-white/70">{bug.description}</p>
            </div>

            {bug.errorMessage && (
              <div>
                <p className="text-xs text-white/50 mb-1">Error</p>
                <pre className="text-xs text-red-300/80 bg-red-500/5 rounded-lg p-3 border border-red-500/10 overflow-x-auto">
                  {bug.errorMessage}
                </pre>
              </div>
            )}

            <div>
              <p className="text-xs text-white/50 mb-1">Fix Prompt (for Claude Code)</p>
              <pre className="text-xs text-white/60 bg-white/[0.03] rounded-lg p-3 border border-white/10 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                {bug.fixPrompt}
              </pre>
            </div>

            <div className="flex gap-2">
              {bug.status === "open" && (
                <Button size="sm" variant="outline" className="border-white/10 text-white/60"
                  onClick={() => onUpdateStatus(bug.id, "in_progress")}>
                  Mark In Progress
                </Button>
              )}
              {(bug.status === "open" || bug.status === "in_progress") && (
                <Button size="sm" className="bg-green-600/80 hover:bg-green-600 text-white"
                  onClick={() => onUpdateStatus(bug.id, "fixed")}>
                  Mark Fixed
                </Button>
              )}
              {bug.status !== "wont_fix" && bug.status !== "fixed" && (
                <Button size="sm" variant="ghost" className="text-white/30"
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
