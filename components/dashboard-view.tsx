"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleOff,
  Clock3,
  Infinity,
  Pencil,
  RotateCcw,
} from "lucide-react";

import { LoopModal } from "@/components/loop-modal";
import { buildLoopPayload, nextMorningIso, type LoopDomain, type LoopRecord } from "@/lib/loop-record";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function DashboardView({
  initialLoops,
  initialDomainFilter,
  initialSection,
  initialError = "",
}: {
  initialLoops: LoopRecord[];
  initialDomainFilter: LoopDomain;
  initialSection: "home" | "later" | "closed";
  initialError?: string;
}) {
  const [loops, setLoops] = useState(initialLoops);
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoop, setEditingLoop] = useState<LoopRecord | null>(null);
  const [closingLoop, setClosingLoop] = useState<LoopRecord | null>(null);

  const visibleLoops = useMemo(() => {
    const domainFiltered =
      initialDomainFilter === "ALL" ? loops : loops.filter((loop) => loop.domain === initialDomainFilter);

    if (initialSection === "later") return domainFiltered.filter((loop) => loop.status === "LATER");
    if (initialSection === "closed") return domainFiltered.filter((loop) => loop.status === "CLOSED");
    return domainFiltered.filter((loop) => loop.status !== "CLOSED");
  }, [initialDomainFilter, initialSection, loops]);

  const currentLoop = useMemo(() => {
    return (
      visibleLoops.find((loop) => loop.isCurrent && loop.status !== "CLOSED") ??
      visibleLoops.find((loop) => loop.status === "ACTIVE") ??
      visibleLoops[0] ??
      null
    );
  }, [visibleLoops]);

  const upNext = useMemo(() => {
    return visibleLoops.filter((loop) => loop.status === "ACTIVE" && loop.id !== currentLoop?.id).slice(0, 4);
  }, [currentLoop?.id, visibleLoops]);

  const resurfacingLoops = useMemo(() => {
    return visibleLoops.filter((loop) => loop.status === "LATER").slice(0, 4);
  }, [visibleLoops]);

  async function persistLoop(
    loop: LoopRecord,
    overrides: Parameters<typeof buildLoopPayload>[1],
    successMessage?: string
  ) {
    setPending(true);
    const response = await fetch(`/api/loops/${loop.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildLoopPayload(loop, overrides)),
    });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to save loop.");
      return null;
    }

    setError(successMessage || "");
    setLoops((current) => current.map((item) => (item.id === data.loop.id ? data.loop : item)));
    return data.loop as LoopRecord;
  }

  async function refresh() {
    setPending(true);
    const query = initialDomainFilter === "ALL" ? "" : `?domain=${initialDomainFilter}`;
    const response = await fetch(`/api/loops${query}`);
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Failed to fetch loops.");
      return;
    }

    setError("");
    setLoops(data.loops);
  }

  async function makeCurrent(loop: LoopRecord) {
    const saved = await persistLoop(loop, { isCurrent: true, status: "ACTIVE", laterUntil: null });
    if (saved) {
      setLoops((current) => current.map((item) => (item.id === saved.id ? saved : { ...item, isCurrent: false })));
    }
  }

  async function deferLoop(loop: LoopRecord) {
    await persistLoop(loop, { status: "LATER", laterUntil: loop.laterUntil || nextMorningIso(), isCurrent: false });
  }

  async function closeLoop(loop: LoopRecord) {
    const saved = await persistLoop(
      loop,
      { status: "CLOSED", isCurrent: false, laterUntil: null },
      `"${loop.title}" moved to Closed.`
    );

    if (saved) {
      setClosingLoop(null);
    }
  }

  async function reopenLoop(loop: LoopRecord) {
    await persistLoop(loop, { status: "ACTIVE", laterUntil: null }, `"${loop.title}" is active again.`);
  }

  return (
    <>
      <main className="dashboard">
        {error ? (
          <div
            className={`banner ${
              error.includes("unavailable") || error.includes("Unable") || error.includes("Failed")
                ? "banner-error"
                : "banner-success"
            }`}
          >
            {error}
          </div>
        ) : null}

        {initialSection === "home" ? (
          <section className="home-stack">
            <div className="focus-hero">
              <div>
                <p className="eyebrow">Current Loop</p>
                <h3>{currentLoop?.title || "No current loop yet"}</h3>
                <p className="muted-copy">{currentLoop?.summary || "Pick or create a loop to anchor your work."}</p>
              </div>
              <div className="focus-meta">
                {currentLoop ? <span className="status-pill status-active">current</span> : null}
                {currentLoop?.domain ? <span className="status-pill">{currentLoop.domain.toLowerCase()}</span> : null}
              </div>
              <div className="hero-next-step">
                <p className="eyebrow">Next Step</p>
                <strong>{currentLoop?.nextStep || "Pick a checklist item when you open this loop."}</strong>
              </div>
              <div className="hero-actions">
                {currentLoop ? (
                  <>
                    <Link className="primary-button" href={`/loops/${currentLoop.id}`}>
                      Open loop
                    </Link>
                    <button className="secondary-button" type="button" onClick={() => setEditingLoop(currentLoop)}>
                      Edit metadata
                    </button>
                    <button className="secondary-button" type="button" onClick={() => void deferLoop(currentLoop)}>
                      Save for later
                    </button>
                  </>
                ) : (
                  <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
                    Create your first loop
                  </button>
                )}
              </div>
            </div>

            <div className="summary-grid">
              <section className="summary-card">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Up Next</p>
                    <h3>Most relevant active loops</h3>
                  </div>
                </div>
                {upNext.length ? (
                  <div className="mini-list">
                    {upNext.map((loop) => (
                      <Link className="mini-row" href={`/loops/${loop.id}`} key={loop.id}>
                        <strong>{loop.title}</strong>
                        {loop.nextStep ? <span>{loop.nextStep}</span> : <span>{formatProgressHint(loop)}</span>}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted-copy">No other active loops are competing for attention right now.</p>
                )}
              </section>

              <section className="summary-card">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Later</p>
                    <h3>Resurfacing threads</h3>
                  </div>
                </div>
                {resurfacingLoops.length ? (
                  <div className="mini-list">
                    {resurfacingLoops.map((loop) => (
                      <Link className="mini-row" href={`/loops/${loop.id}`} key={loop.id}>
                        <strong>{loop.title}</strong>
                        <span>{formatLaterUntil(loop.laterUntil)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted-copy">Nothing is deferred right now.</p>
                )}
              </section>
            </div>
          </section>
        ) : null}

        {visibleLoops.length === 0 ? (
          <section className="empty-state-panel">
            <div className="empty-glyph">
              <Infinity size={58} />
            </div>
            <h3>{initialSection === "closed" ? "No closed loops yet" : "No open loops"}</h3>
            <p>
              {initialSection === "later"
                ? "Nothing is parked for resurfacing right now."
                : "Press Cmd/Ctrl+Shift+O or click New to open your first loop."}
            </p>
            <div className="empty-actions">
              <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
                Open a Loop
              </button>
              <button className="secondary-button" type="button" onClick={refresh} disabled={pending}>
                {pending ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </section>
        ) : (
          <section className="loop-list-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Focus Stack</p>
                <h3>{initialSection === "home" ? "All visible loops" : "Your loops"}</h3>
              </div>
            </div>

            <div className="loop-list">
              {visibleLoops.map((loop) => (
                <div className="loop-row" key={loop.id}>
                  <Link className="loop-row-main" href={`/loops/${loop.id}`}>
                    <div className="loop-row-top">
                      <strong>{loop.title}</strong>
                      <span className={`status-pill status-${loop.status.toLowerCase()}`}>{loop.status.toLowerCase()}</span>
                    </div>
                    {loop.nextStep ? <p>{loop.nextStep}</p> : null}
                    <div className="loop-row-meta">
                      <span>{loop.domain.toLowerCase()}</span>
                      <span>{loop.priority.toLowerCase()}</span>
                      <span>{formatCardTiming(loop)}</span>
                      <span>{formatProgressHint(loop)}</span>
                      {loop.isCurrent ? <span>current</span> : null}
                    </div>
                  </Link>
                  <div className="row-actions">
                    <button
                      className="icon-button small-icon-button"
                      onClick={() => setEditingLoop(loop)}
                      type="button"
                      aria-label="Edit loop"
                    >
                      <Pencil size={14} />
                    </button>
                    {loop.status !== "CLOSED" ? (
                      <button
                        className="icon-button small-icon-button"
                        onClick={() => void makeCurrent(loop)}
                        type="button"
                        aria-label="Make current"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    ) : null}
                    {loop.status === "CLOSED" ? (
                      <button
                        className="icon-button small-icon-button"
                        onClick={() => void reopenLoop(loop)}
                        type="button"
                        aria-label="Reopen loop"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <button
                        className="icon-button small-icon-button"
                        onClick={() => setClosingLoop(loop)}
                        type="button"
                        aria-label="Close loop"
                      >
                        <CircleOff size={14} />
                      </button>
                    )}
                    {loop.status !== "CLOSED" ? (
                      <button
                        className="icon-button small-icon-button"
                        onClick={() => void deferLoop(loop)}
                        type="button"
                        aria-label="Save for later"
                      >
                        <Clock3 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <LoopModal
        defaultDomain={initialDomainFilter === "ALL" ? currentLoop?.domain || "WORK" : initialDomainFilter}
        isOpen={modalOpen || !!editingLoop}
        loop={editingLoop}
        loops={loops}
        onClose={() => {
          setModalOpen(false);
          setEditingLoop(null);
        }}
        onSaved={(loop) => {
          setLoops((current) => {
            const existing = current.find((item) => item.id === loop.id);
            if (existing) {
              return current.map((item) => (item.id === loop.id ? loop : item));
            }

            return [loop, ...current];
          });
          setModalOpen(false);
          setEditingLoop(null);
        }}
      />

      {closingLoop ? (
        <div className="modal-overlay" role="presentation">
          <div className="modal-backdrop" onClick={() => setClosingLoop(null)} />
          <section className="modal-card completion-modal" role="dialog" aria-modal="true" aria-labelledby="close-loop-title">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="brand-mark modal-mark">✓</div>
                <h3 id="close-loop-title">Close loop</h3>
              </div>
            </div>

            <div className="modal-body completion-body">
              <div>
                <p className="eyebrow">Ready to wrap this thread?</p>
                <h4>{closingLoop.title}</h4>
                <p className="muted-copy">
                  {closingLoop.summary || "Mark this loop complete and keep the thread traceable in Closed."}
                </p>
              </div>

              <div className="completion-summary-grid">
                <div className="signal-card">
                  <div>
                    <span>Checklist</span>
                    <strong>{formatProgressHint(closingLoop)}</strong>
                  </div>
                </div>
                <div className="signal-card">
                  <div>
                    <span>Subloops</span>
                    <strong>{formatSubloopSummary(closingLoop)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="ghost-button" type="button" onClick={() => setClosingLoop(null)}>
                Keep open
              </button>
              <button className="primary-button" type="button" onClick={() => void closeLoop(closingLoop)} disabled={pending}>
                {pending ? "Closing..." : "Close loop"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No deadline";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No deadline" : DATE_FORMATTER.format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "No date set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No date set" : DATE_TIME_FORMATTER.format(date);
}

function formatLaterUntil(value: string | null | undefined) {
  const formatted = formatDateTime(value);
  return formatted === "No date set" ? "Saved for later" : `Returns ${formatted}`;
}

function formatCardTiming(loop: LoopRecord) {
  if (loop.status === "LATER" && loop.laterUntil) {
    return formatLaterUntil(loop.laterUntil);
  }

  if (loop.dueDate) {
    return `Due ${formatDate(loop.dueDate)}`;
  }

  return loop.status === "WAITING" ? "Waiting" : "No timing set";
}

function formatProgressHint(loop: LoopRecord) {
  if (loop.checklistItems.length === 0) {
    return loop.nextStep ? "Next step set" : "No next step yet";
  }

  const completed = loop.checklistItems.filter((item) => item.completed).length;
  return `${completed}/${loop.checklistItems.length} complete`;
}

function formatSubloopSummary(loop: LoopRecord) {
  if (loop.children.length === 0) {
    return "No subloops";
  }

  const openChildren = loop.children.filter((child) => child.status !== "CLOSED").length;
  return openChildren === 0 ? "All subloops closed" : `${openChildren} still open`;
}
