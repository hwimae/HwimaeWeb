import React from "react";
import { Sparkles } from "lucide-react";

export function AdvisorSummaryCard({ answer }: { answer: string }) {
  return (
    <section
      className="story-advisor-summary-card glass-card"
      aria-label="Tóm tắt tư vấn từ AI"
    >
      <div className="story-advisor-summary-icon" aria-hidden="true">
        <Sparkles size={18} />
      </div>
      <div className="section-stack">
        <p className="story-advisor-summary-label">StoryRec AI</p>
        <p className="story-advisor-summary-answer">{answer}</p>
      </div>
    </section>
  );
}
