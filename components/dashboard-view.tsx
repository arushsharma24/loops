"use client";

import { CalendarClock, CheckCircle2, ChevronRight, Clock3, Flag, Infinity, Pencil, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoopModal } from "@/components/loop-modal";
import { buildLoopPayload, nextMorningIso, type ChecklistRecord, type LoopDomain, type LoopRecord, type LoopStatus } from "@/lib/loop-record";

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
  const [selectedId, setSelectedId] = useState<string | null>(initialLoops[0]?.id ?? null);
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoop, setEditingLoop] = useState<LoopRecord | null>(null);
  const [draftNextStep, setDraftNextStep] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftStatus, setDraftStatus] = useState<LoopStatus>("ACTIVE");
  const [checklistInput, setChecklistInput] = useState("");
  const [subloopTitle, setSubloopTitle] = useState("");

  useEffect(() => {
    setLoops(initialLoops);
  }, [initialLoops]);

  const visibleLoops = useMemo(() => {
    const domainFiltered =
      initialDomainFilter === "ALL" ? loops : loops.filter((loop) => loop.domain === initialDomainFilter);

    if (initialSection === "later") return domainFiltered.filter((loop) => loop.status === "LATER");
    if (initialSection === "closed") return domainFiltered.filter((loop) => loop.status === "CLOSED");
    return domainFiltered.filter((loop) => loop.status !== "CLOSED");
  }, [initialDomainFilter, initialSection, loops]);

  const selectedLoop = useMemo(() => {
    return visibleLoops.find((loop) => loop.id === selectedId) ?? visibleLoops[0] ?? null;
  }, [selectedId, visibleLoops]);

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

  useEffect(() => {
    if (selectedLoop) {
      setDraftNextStep(selectedLoop.nextStep || "");
      setDraftNotes(selectedLoop.notes || "");
      setDraftStatus(selectedLoop.status);
      return;
    }

    setDraftNextStep("");
    setDraftNotes("");
    setDraftStatus("ACTIVE");
  }, [selectedLoop]);

  useEffect(() => {
    if (!selectedLoop && visibleLoops[0]) {
      setSelectedId(visibleLoops[0].id);
    }
  }, [selectedLoop, visibleLoops]);

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
    if ((!selectedId || !data.loops.find((loop: LoopRecord) => loop.id === selectedId)) && data.loops[0]) {
      setSelectedId(data.loops[0].id);
    }
  }

  async function persistLoop(loop: LoopRecord, overrides: Parameters<typeof buildLoopPayload>[1], successMessage?: string) {
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

  async function deleteLoop(loop: LoopRecord) {
    setPending(true);
    const response = await fetch(`/api/loops/${loop.id}`, { method: "DELETE" });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to delete loop.");
      return;
    }

    setLoops((current) =>
      current
        .filter((item) => item.id !== loop.id)
        .map((item) =>
          item.id === loop.parentId
            ? { ...item, children: item.children.filter((child) => child.id !== loop.id) }
            : item
        )
    );
    if (selectedId === loop.id) {
      setSelectedId(null);
    }
  }

  async function saveOperationalEdits() {
    if (!selectedLoop) return;

    await persistLoop(selectedLoop, {
      nextStep: draftNextStep || null,
      notes: draftNotes || null,
      status: draftStatus,
      laterUntil: draftStatus === "LATER" ? selectedLoop.laterUntil || nextMorningIso() : null,
      dueDate: draftStatus === "LATER" ? null : selectedLoop.dueDate,
      isCurrent: draftStatus === "ACTIVE" ? selectedLoop.isCurrent : false,
    });
  }

  async function updateChecklist(nextItems: ChecklistRecord[]) {
    if (!selectedLoop) return;
    await persistLoop(selectedLoop, { checklistItems: nextItems });
  }

  async function addChecklistItem() {
    if (!selectedLoop || !checklistInput.trim()) return;
    const nextItems = [
      ...selectedLoop.checklistItems,
      { id: crypto.randomUUID(), label: checklistInput.trim(), completed: false, order: selectedLoop.checklistItems.length },
    ];
    const saved = await persistLoop(selectedLoop, { checklistItems: nextItems });
    if (saved) {
      setChecklistInput("");
    }
  }

  async function toggleChecklist(itemId: string) {
    if (!selectedLoop) return;
    const nextItems = selectedLoop.checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateChecklist(nextItems);
  }

  async function removeChecklist(itemId: string) {
    if (!selectedLoop) return;
    const nextItems = selectedLoop.checklistItems
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));
    await updateChecklist(nextItems);
  }

  async function makeCurrent(loop: LoopRecord) {
    const saved = await persistLoop(loop, { isCurrent: true, status: "ACTIVE", laterUntil: null });
    if (saved) {
      setLoops((current) =>
        current.map((item) =>
          item.id === saved.id ? saved : { ...item, isCurrent: false }
        )
      );
      setSelectedId(saved.id);
    }
  }

  async function deferLoop(loop: LoopRecord) {
    await persistLoop(loop, { status: "LATER", laterUntil: nextMorningIso(), isCurrent: false });
  }

  async function createSubloop() {
    if (!selectedLoop || !subloopTitle.trim()) return;

    setPending(true);
    const response = await fetch("/api/loops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subloopTitle.trim(),
        summary: null,
        domain: selectedLoop.domain,
        type: "ACTION",
        status: "ACTIVE",
        priority: "MEDIUM",
        parentId: selectedLoop.id,
        nextStep: null,
        notes: null,
        dueDate: null,
        reminderAt: null,
        laterUntil: null,
        tags: [],
        pinned: false,
        isCurrent: false,
        checklistItems: [],
      }),
    });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to create subloop.");
      return;
    }

    setLoops((current) => [
      data.loop,
      ...current.map((item) =>
        item.id === selectedLoop.id
          ? {
              ...item,
              children: [
                { id: data.loop.id, title: data.loop.title, status: data.loop.status, nextStep: data.loop.nextStep, domain: data.loop.domain, parentId: data.loop.parentId },
                ...item.children,
              ],
            }
          : item
      ),
    ]);
    setSubloopTitle("");
  }

  return (
    <>
      <main className="dashboard">
        {error ? <div className={`banner ${error.includes("unavailable") || error.includes("Unable") || error.includes("Failed") ? "banner-error" : "banner-success"}`}>{error}</div> : null}

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
                <strong>{currentLoop?.nextStep || "Define the next useful move."}</strong>
              </div>
              <div className="hero-actions">
                {currentLoop ? (
                  <>
                    <button className="primary-button" type="button" onClick={() => setSelectedId(currentLoop.id)}>
                      Open loop
                    </button>
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
                      <button className="mini-row" key={loop.id} onClick={() => setSelectedId(loop.id)} type="button">
                        <strong>{loop.title}</strong>
                        <span>{loop.nextStep || "No next step yet."}</span>
                      </button>
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
                      <button className="mini-row" key={loop.id} onClick={() => setSelectedId(loop.id)} type="button">
                        <strong>{loop.title}</strong>
                        <span>{loop.laterUntil ? `Returns ${formatDateTime(loop.laterUntil)}` : "Saved for later"}</span>
                      </button>
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
                : "Press N or click New to open your first loop."}
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
          <div className="dashboard-grid">
            <section className="loop-list-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Focus Stack</p>
                  <h3>{initialSection === "home" ? "All visible loops" : "Your loops"}</h3>
                </div>
              </div>

              <div className="loop-list">
                {visibleLoops.map((loop) => (
                  <div className={`loop-row ${selectedLoop?.id === loop.id ? "is-selected" : ""}`} key={loop.id}>
                    <button className="loop-row-main" onClick={() => setSelectedId(loop.id)} type="button">
                      <div className="loop-row-top">
                        <strong>{loop.title}</strong>
                        <span className={`status-pill status-${loop.status.toLowerCase()}`}>{loop.status.toLowerCase()}</span>
                      </div>
                      <p>{loop.nextStep || "Define the next useful move."}</p>
                      <div className="loop-row-meta">
                        <span>{loop.domain.toLowerCase()}</span>
                        <span>{loop.priority.toLowerCase()}</span>
                        {loop.dueDate ? <span>{formatDate(loop.dueDate)}</span> : null}
                        {loop.isCurrent ? <span>current</span> : null}
                      </div>
                    </button>
                    <div className="row-actions">
                      <button className="icon-button small-icon-button" onClick={() => setEditingLoop(loop)} type="button" aria-label="Edit loop">
                        <Pencil size={14} />
                      </button>
                      <button className="icon-button small-icon-button" onClick={() => void makeCurrent(loop)} type="button" aria-label="Make current">
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="icon-button small-icon-button" onClick={() => void deferLoop(loop)} type="button" aria-label="Save for later">
                        <Clock3 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="loop-detail-panel">
              {selectedLoop ? (
                <>
                  <div className="detail-header">
                    <div>
                      <p className="eyebrow">Current Thread</p>
                      <h3>{selectedLoop.title}</h3>
                      <p className="muted-copy">{selectedLoop.summary || "No summary yet."}</p>
                    </div>
                    <div className="detail-header-actions">
                      <button className="secondary-button" type="button" onClick={() => setEditingLoop(selectedLoop)}>
                        Edit metadata
                      </button>
                      <button className="secondary-button" type="button" onClick={() => void makeCurrent(selectedLoop)}>
                        Make current
                      </button>
                    </div>
                  </div>

                  <div className="signal-row">
                    <div className="signal-card">
                      <Sparkles size={16} />
                      <div>
                        <span>Next step</span>
                        <strong>{selectedLoop.nextStep || "Set the next useful action."}</strong>
                      </div>
                    </div>
                    <div className="signal-card">
                      <Flag size={16} />
                      <div>
                        <span>Priority</span>
                        <strong>{selectedLoop.priority.toLowerCase()}</strong>
                      </div>
                    </div>
                    <div className="signal-card">
                      <CalendarClock size={16} />
                      <div>
                        <span>Timing</span>
                        <strong>{selectedLoop.laterUntil ? `Later until ${formatDateTime(selectedLoop.laterUntil)}` : selectedLoop.dueDate ? `Due ${formatDate(selectedLoop.dueDate)}` : "No timing set"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-sections">
                    <section className="detail-section-card">
                      <p className="eyebrow">Thread Controls</p>
                      <div className="control-grid">
                        <label className="stacked-field compact-field">
                          <span>Status</span>
                          <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as LoopStatus)}>
                            <option value="ACTIVE">Active</option>
                            <option value="WAITING">Waiting</option>
                            <option value="LATER">Later</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </label>

                        <label className="stacked-field compact-field">
                          <span>Next step</span>
                          <input value={draftNextStep} onChange={(event) => setDraftNextStep(event.target.value)} />
                        </label>
                      </div>

                      <label className="stacked-field">
                        <span>Notes</span>
                        <textarea rows={5} value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
                      </label>

                      <div className="detail-actions-row">
                        <button className="primary-button" type="button" onClick={() => void saveOperationalEdits()} disabled={pending}>
                          <Save size={16} />
                          Save changes
                        </button>
                        <button className="secondary-button" type="button" onClick={() => void deferLoop(selectedLoop)}>
                          Save for later
                        </button>
                        <button className="ghost-button danger-button" type="button" onClick={() => void deleteLoop(selectedLoop)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </section>

                    <section className="detail-section-card">
                      <p className="eyebrow">Checklist</p>
                      {selectedLoop.checklistItems.length ? (
                        <div className="check-grid">
                          {selectedLoop.checklistItems.map((item) => (
                            <div className={`check-item ${item.completed ? "is-done" : ""}`} key={item.id}>
                              <button className="check-toggle" onClick={() => void toggleChecklist(item.id)} type="button">
                                {item.completed ? "✓" : "○"}
                              </button>
                              <span>{item.label}</span>
                              <button className="ghost-button remove-button" onClick={() => void removeChecklist(item.id)} type="button">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-copy">No checklist items yet.</p>
                      )}

                      <div className="inline-editor">
                        <input
                          placeholder="Add checklist item"
                          value={checklistInput}
                          onChange={(event) => setChecklistInput(event.target.value)}
                        />
                        <button className="secondary-button" onClick={() => void addChecklistItem()} type="button">
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </section>

                    <section className="detail-section-card">
                      <p className="eyebrow">Notes</p>
                      <div className="note-block">{selectedLoop.notes || "No notes yet."}</div>
                    </section>

                    <section className="detail-section-card">
                      <p className="eyebrow">Structure</p>
                      {selectedLoop.parent ? (
                        <button className="breadcrumb" onClick={() => setSelectedId(selectedLoop.parent!.id)} type="button">
                          <span>{selectedLoop.parent.title}</span>
                          <ChevronRight size={14} />
                          <span>{selectedLoop.title}</span>
                        </button>
                      ) : (
                        <p className="muted-copy">Top-level loop</p>
                      )}

                      <div className="inline-editor">
                        <input
                          placeholder="Create subloop"
                          value={subloopTitle}
                          onChange={(event) => setSubloopTitle(event.target.value)}
                        />
                        <button className="secondary-button" onClick={() => void createSubloop()} type="button">
                          <Plus size={16} />
                          Add subloop
                        </button>
                      </div>

                      {selectedLoop.children.length ? (
                        <div className="subloop-list">
                          {selectedLoop.children.map((child) => (
                            <button className="subloop-card subloop-button" key={child.id} onClick={() => setSelectedId(child.id)} type="button">
                              <strong>{child.title}</strong>
                              <span>{child.nextStep || "No next step yet."}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-copy">No subloops yet.</p>
                      )}
                    </section>
                  </div>
                </>
              ) : null}
            </aside>
          </div>
        )}
      </main>

      <LoopModal
        defaultDomain={initialDomainFilter === "ALL" ? selectedLoop?.domain || currentLoop?.domain || "WORK" : initialDomainFilter}
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
          setSelectedId(loop.id);
          setModalOpen(false);
          setEditingLoop(null);
        }}
      />
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "IST",
  }).format(new Date(value));
}
