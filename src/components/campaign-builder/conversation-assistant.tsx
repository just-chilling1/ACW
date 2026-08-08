"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { ConversationResponse, OfferAnalysis } from "@/lib/campaign/types";
import { Field } from "@/components/ui/field";
import { ReplyCard } from "@/components/ui/reply-card";
import { GenerationProgress } from "@/components/ui/generation-progress";

type ConversationAssistantProps = {
  analysis: OfferAnalysis;
  ourPreviousReply: string;
};

export function ConversationAssistant({ analysis, ourPreviousReply }: ConversationAssistantProps) {
  const [theirReply, setTheirReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ConversationResponse | null>(null);

  const handleGenerate = async () => {
    if (!theirReply.trim()) {
      setError("Paste their response first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/campaign/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          theirReply: theirReply.trim(),
          ourPreviousReply,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "Failed");
      setResponse(data.response);
    } catch {
      setError("We couldn't generate a response right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card-base flex flex-col gap-5 p-6!">
      <div>
        <h3 className="ds-h3">Someone replied?</h3>
        <p className="mt-1 text-sm text-text-muted">Paste their response below and AI will suggest what to say next.</p>
      </div>

      <Field
        as="textarea"
        placeholder="Paste their reply here..."
        value={theirReply}
        onChange={(e) => {
          setTheirReply(e.target.value);
          if (error) setError("");
        }}
        error={error || undefined}
        aria-label="Their reply"
      />

      <button type="button" onClick={handleGenerate} disabled={loading} className="btn-primary">
        <Sparkles size={16} aria-hidden />
        <span>{loading ? "Generating..." : "Generate My Response"}</span>
      </button>

      {loading ? <GenerationProgress active label="Thinking about the best reply..." showBanner={false} /> : null}

      {response ? (
        <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-5">
          <ReplyCard styleLabel="Recommended response" text={response.recommended} />
          <div className="ds-well p-4">
            <p className="ds-h4 mb-1 text-text-muted">Why this response</p>
            <p className="text-sm text-text-secondary">{response.why}</p>
          </div>
          {response.softer ? <ReplyCard styleLabel="Softer version" text={response.softer} /> : null}
          {response.stronger ? <ReplyCard styleLabel="Stronger version" text={response.stronger} /> : null}
        </div>
      ) : null}
    </section>
  );
}
