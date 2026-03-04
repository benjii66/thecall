"use client";

import { BuildAnalysis } from "@/types/coaching";
import { useLanguage } from "@/lib/language";

interface BuildAnalysisCardProps {
  analysis: BuildAnalysis;
}

export function BuildAnalysisCard({ analysis }: BuildAnalysisCardProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-6 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {t("coaching.buildAnalysis.title")}
            </h3>
            <p className="text-xs text-white/40">
                {t("coaching.buildAnalysis.subtitle")}
            </p>
          </div>
      </div>

      <div className="space-y-6">
        {/* Critique Globale */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/5">
          <div className="flex gap-3">
             <div className="shrink-0 w-1 bg-orange-500 rounded-full h-auto self-stretch opacity-70" />
             <div>
                <h4 className="mb-1 text-xs font-semibold text-orange-300 uppercase opacity-80">
                    {t("coaching.buildAnalysis.critique")}
                </h4>
                <p className="text-sm text-white/80 leading-relaxed">
                    {analysis.critique}
                </p>
             </div>
          </div>
        </div>

        {/* Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white/30 uppercase pl-1">
                {t("coaching.buildAnalysis.suggestion")}
            </h4>
            
            {analysis.suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="group relative flex flex-col md:flex-row md:items-center gap-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 p-4 transition-colors"
              >
                {/* Item Replacement Visual */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* BAD ITEM */}
                    <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500/50">
                            <span className="text-lg">✕</span>
                        </div>
                         <span className="text-[10px] text-red-300/50 max-w-[60px] text-center truncate">{suggestion.replace}</span>
                    </div>
                    
                    <div className="text-white/20">→</div>

                    {/* GOOD ITEM */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]">
                            <span className="text-lg">✓</span>
                        </div>
                         <span className="text-[10px] text-green-300/80 max-w-[60px] text-center truncate">{suggestion.item}</span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-bold text-green-400 text-sm truncate">
                       {suggestion.item}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-snug">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
