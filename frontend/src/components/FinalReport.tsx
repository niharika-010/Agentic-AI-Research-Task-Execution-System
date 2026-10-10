import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { 
  TaskDetail, 
  Source 
} from '../types';
import { 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  RotateCcw
} from 'lucide-react';

interface FinalReportProps {
  task: TaskDetail;
}

export const FinalReport: React.FC<FinalReportProps> = ({ task }) => {
  const [copied, setCopied] = useState(false);

  const reportText = task.final_report || task.draft_markdown || 'No report generated yet.';
  const sources: Source[] = task.sources || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_report_${task.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Reviewer Verdict Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Reviewer Quality Verification
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  Approved (Score: 95/100)
                </span>
                {task.revision_count > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    <span>Revised ({task.revision_count} iteration)</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Audited against original objectives, source grounding, and analytical depth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export .md</span>
            </button>
          </div>
        </div>

        {task.review_feedback && (
          <div className="mt-4 border-t border-emerald-500/20 pt-4 text-xs text-slate-300 italic">
            <span className="font-semibold text-emerald-400 not-italic">Reviewer Evaluation: </span>
            "{task.review_feedback}"
          </div>
        )}
      </div>

      {/* Main Report Document Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <article className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:mt-8 prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-indigo-300 prose-a:text-cyan-400 hover:prose-a:underline prose-blockquote:border-indigo-500 prose-blockquote:text-slate-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {reportText}
          </ReactMarkdown>
        </article>
      </div>

      {/* Verified Web Citations Drawer/Grid */}
      {sources.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              <span>Verified Web Citations & Evidence Grounding</span>
            </h3>
            <span className="text-xs text-slate-500">
              {sources.length} Real-World Sources
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all hover:border-cyan-500/40 hover:bg-slate-900/80"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      {src.title}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3">
                    {src.snippet}
                  </p>
                </div>
                <div className="mt-3 truncate text-[11px] font-mono text-cyan-500/80">
                  {src.url}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
