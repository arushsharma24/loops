"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleOff,
  Clock3,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { LoopModal } from "@/components/loop-modal";
import {
  buildLoopPayload,
  nextMorningIso,
  normalizeChecklistItems,
  type ChecklistRecord,
  type LoopRecord,
} from "@/lib/loop-record";

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

export function LoopPageView({
  initialLoop,
  loops,
}: {
  initialLoop: LoopRecord;
  loops: LoopRecord[];
}) {
  const router = useRouter();
  const [loop, setLoop] = useState(initialLoop);
  const [availableLoops, setAvailableLoops] = useState(loops);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [editingLoop, setEditingLoop] = useState<LoopRecord | null>(null);
  const [closingLoop, setClosingLoop] = useState<LoopRecord | null>(null);
  const [notesDraft, setNotesDraft] = useState(initialLoop.notes || "");
  const [fallbackNextStep, setFallbackNextStep] = useState(initialLoop.nextStep || "");
  const [dueDateDraft, setDueDateDraft] = useState(toDateInputValue(initialLoop.dueDate));
  const [laterUntilDraft, setLaterUntilDraft] = useState(toDateInputValue(initialLoop.laterUntil));
  const [checklistDraft, setChecklistDraft] = useState<ChecklistRecord[]>(initialLoop.checklistItems);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [subloopTitle, setSubloopTitle] = useState("");

  useEffect(() => {
    setLoop(initialLoop);
    setNotesDraft(initialLoop.notes || "");
    setFallbackNextStep(initialLoop.nextStep || "");
    setDueDateDraft(toDateInputValue(initialLoop.dueDate));
    setLaterUntilDraft(toDateInputValue(initialLoop.laterUntil));
    setChecklistDraft(initialLoop.checklistItems);
  }, [initialLoop]);

  const activeNextStep = useMemo(
    () => checklistDraft.find((item) => item.isNextStep && !item.completed)?.label || fallbackNextStep || "",
    [checklistDraft, fallbackNextStep]
  );

  async function persistLoop(overrides: Parameters<typeof buildLoopPayload>[1], successMessage?: string) {
    setPending(true);
    const payload = buildLoopPayload(loop, overrides);
    const response = await fetch(`/api/loops/${loop.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to save loop.");
      return null;
    }

    setError(successMessage || "");
    setLoop(data.loop);
    setChecklistDraft(data.loop.checklistItems);
    setNotesDraft(data.loop.notes || "");
    setFallbackNextStep(data.loop.nextStep || "");
    setDueDateDraft(toDateInputValue(data.loop.dueDate));
    setLaterUntilDraft(toDateInputValue(data.loop.laterUntil));
    setAvailableLoops((current) => current.map((item) => (item.id === data.loop.id ? data.loop : item)));
    return data.loop as LoopRecord;
  }

  async function deleteLoop() {
    setPending(true);
    const response = await fetch(`/api/loops/${loop.id}`, { method: "DELETE" });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to delete loop.");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  async function saveChecklist(nextItems: ChecklistRecord[], nextFallback = fallbackNextStep) {
    const normalized = normalizeChecklistItems(nextItems);
    setChecklistDraft(normalized);
    await persistLoop({ checklistItems: normalized, nextStep: nextFallback || null });
  }

  async function toggleChecklist(itemId: string) {
    const nextItems = checklistDraft.map((item) =>
      item.id === itemId
        ? { ...item, completed: !item.completed, isNextStep: item.completed ? item.isNextStep : false }
        : item
    );
    await saveChecklist(nextItems);
  }

  async function updateChecklistLabel(itemId: string, label: string) {
    const nextItems = checklistDraft.map((item) => (item.id === itemId ? { ...item, label } : item));
    setChecklistDraft(nextItems);
  }

  async function commitChecklistLabel(itemId: string) {
    const nextItems = checklistDraft
      .map((item) => (item.id === itemId ? { ...item, label: item.label.trim() } : item))
      .filter((item) => item.label);
    await saveChecklist(nextItems);
  }

  async function setChecklistNextStep(itemId: string) {
    const nextItems = checklistDraft.map((item) => ({
      ...item,
      isNextStep: item.id === itemId && !item.completed,
    }));
    const chosen = nextItems.find((item) => item.id === itemId);
    await saveChecklist(nextItems, chosen?.label || "");
  }

  async function moveChecklist(itemId: string, direction: -1 | 1) {
    const currentIndex = checklistDraft.findIndex((item) => item.id === itemId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= checklistDraft.length) {
      return;
    }

    const nextItems = [...checklistDraft];
    const [item] = nextItems.splice(currentIndex, 1);
    nextItems.splice(nextIndex, 0, item);
    await saveChecklist(nextItems.map((entry, index) => ({ ...entry, order: index })));
  }

  async function removeChecklist(itemId: string) {
    const nextItems = checklistDraft
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));
    await saveChecklist(nextItems);
  }

  async function addChecklistItem() {
    if (!newChecklistItem.trim()) return;
    const nextItems = [
      ...checklistDraft,
      {
        id: crypto.randomUUID(),
        label: newChecklistItem.trim(),
        completed: false,
        isNextStep: checklistDraft.length === 0,
        order: checklistDraft.length,
      },
    ];
    setNewChecklistItem("");
    await saveChecklist(nextItems, fallbackNextStep);
  }

  async function saveThreadNotes() {
    await persistLoop({ notes: notesDraft || null, nextStep: fallbackNextStep || null });
  }

  async function saveTiming() {
    await persistLoop({
      dueDate: dueDateDraft ? toIsoDate(dueDateDraft) : null,
      laterUntil: loop.status === "LATER" && laterUntilDraft ? toIsoDate(laterUntilDraft) : null,
      nextStep: fallbackNextStep || null,
    });
  }

  async function makeCurrent() {
    await persistLoop({ isCurrent: true, status: "ACTIVE", laterUntil: null });
  }

  async function saveForLater() {
    await persistLoop({
      status: "LATER",
      laterUntil: laterUntilDraft ? toIsoDate(laterUntilDraft) : nextMorningIso(),
      dueDate: dueDateDraft ? toIsoDate(dueDateDraft) : null,
      isCurrent: false,
    });
  }

  async function reopenLoop() {
    await persistLoop({ status: "ACTIVE", laterUntil: null }, `"${loop.title}" is active again.`);
  }

  async function closeLoop() {
    const saved = await persistLoop({ status: "CLOSED", isCurrent: false, laterUntil: null }, `"${loop.title}" moved to Closed.`);
    if (saved) {
      setClosingLoop(null);
    }
  }

  async function createSubloop() {
    if (!subloopTitle.trim()) return;

    setPending(true);
    const response = await fetch("/api/loops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subloopTitle.trim(),
        summary: null,
        domain: loop.domain,
        type: "ACTION",
        status: "ACTIVE",
        priority: "MEDIUM",
        parentId: loop.id,
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

    setSubloopTitle("");
    setLoop((current) => ({
      ...current,
      children: [
        {
          id: data.loop.id,
          title: data.loop.title,
          status: data.loop.status,
          nextStep: data.loop.nextStep,
          domain: data.loop.domain,
          parentId: data.loop.parentId,
        },
        ...current.children,
      ],
    }));
    setAvailableLoops((current) => [data.loop, ...current]);
  }

  return (
    <>
      <main className="dashboard loop-page-shell">
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

        <div className="loop-page-stack">
          <div className="loop-page-header-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Loop View</p>
                <h3>{loop.title}</h3>
              </div>
              <Link className="text-button" href="/home">
                <ArrowLeft size={16} />
                Back to Home
              </Link>
            </div>

            <div className="focus-meta">
              <span className={`status-pill status-${loop.status.toLowerCase()}`}>{loop.status.toLowerCase()}</span>
              <span className="status-pill">{loop.domain.toLowerCase()}</span>
              <span className="status-pill">{loop.type.toLowerCase()}</span>
              <span className="status-pill">{formatProgress(loop)}</span>
            </div>

            <p className="muted-copy">{loop.summary || "This thread is ready for a clearer next useful move."}</p>

            <div className="hero-actions">
              <button className="secondary-button" type="button" onClick={() => setEditingLoop(loop)}>
                <Pencil size={16} />
                Edit metadata
              </button>
              {loop.status === "CLOSED" ? (
                <button className="secondary-button" type="button" onClick={() => void reopenLoop()}>
                  <RotateCcw size={16} />
                  Reopen loop
                </button>
              ) : (
                <>
                  <button className="secondary-button" type="button" onClick={() => void makeCurrent()}>
                    <CheckCircle2 size={16} />
                    Make current
                  </button>
                  <button className="secondary-button" type="button" onClick={() => void saveForLater()}>
                    <Clock3 size={16} />
                    Save for later
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setClosingLoop(loop)}>
                    <CircleOff size={16} />
                    Close loop
                  </button>
                </>
              )}
            </div>
          </div>

          <section className="focus-hero loop-page-hero">
            <div>
              <p className="eyebrow">Next Up</p>
              <h3>{activeNextStep || "Choose the next useful move"}</h3>
              <p className="muted-copy">
                {activeNextStep
                  ? "This is the action anchor for the loop right now."
                  : "Pick a checklist item as the active next step, or use a lightweight fallback if the work is still fuzzy."}
              </p>
            </div>

            {!checklistDraft.some((item) => item.isNextStep && !item.completed) ? (
              <label className="stacked-field">
                <span>Fallback next step</span>
                <input
                  placeholder="Write the immediate next useful move"
                  value={fallbackNextStep}
                  onChange={(event) => setFallbackNextStep(event.target.value)}
                  onBlur={() => void persistLoop({ nextStep: fallbackNextStep || null })}
                />
              </label>
            ) : null}
          </section>

          <div className="loop-page-grid">
            <section className="detail-section-card">
              <p className="eyebrow">Checklist</p>
              {checklistDraft.length ? (
                <div className="check-grid">
                  {checklistDraft.map((item, index) => (
                    <div className={`check-item check-item-card ${item.completed ? "is-done" : ""}`} key={item.id}>
                      <button className="check-toggle" onClick={() => void toggleChecklist(item.id)} type="button">
                        {item.completed ? "✓" : "○"}
                      </button>
                      <input
                        className={`check-item-input ${item.isNextStep ? "is-next-step" : ""}`}
                        value={item.label}
                        onChange={(event) => void updateChecklistLabel(item.id, event.target.value)}
                        onBlur={() => void commitChecklistLabel(item.id)}
                      />
                      <div className="check-item-actions">
                        <button className="ghost-button small-text-button" onClick={() => void setChecklistNextStep(item.id)} type="button">
                          <Check size={14} />
                          {item.isNextStep ? "Next step" : "Set next"}
                        </button>
                        <button className="icon-button small-icon-button" onClick={() => void moveChecklist(item.id, -1)} type="button" disabled={index === 0}>
                          <ChevronUp size={14} />
                        </button>
                        <button
                          className="icon-button small-icon-button"
                          onClick={() => void moveChecklist(item.id, 1)}
                          type="button"
                          disabled={index === checklistDraft.length - 1}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button className="ghost-button remove-button" onClick={() => void removeChecklist(item.id)} type="button">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">No checklist items yet. Add a few concrete moves and pick one as the current next step.</p>
              )}

              <form
                className="inline-editor"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addChecklistItem();
                }}
              >
                <input
                  placeholder="Add checklist item"
                  value={newChecklistItem}
                  onChange={(event) => setNewChecklistItem(event.target.value)}
                />
                <button className="secondary-button" type="submit">
                  <Plus size={16} />
                  Add
                </button>
              </form>
            </section>

            <section className="detail-section-card">
              <p className="eyebrow">Structure</p>
              {loop.parent ? (
                <Link className="breadcrumb" href={`/loops/${loop.parent.id}`}>
                  <span>{loop.parent.title}</span>
                </Link>
              ) : (
                <p className="muted-copy">Top-level loop</p>
              )}

              <form
                className="inline-editor"
                onSubmit={(event) => {
                  event.preventDefault();
                  void createSubloop();
                }}
              >
                <input
                  placeholder="Create subloop"
                  value={subloopTitle}
                  onChange={(event) => setSubloopTitle(event.target.value)}
                />
                <button className="secondary-button" type="submit">
                  <Plus size={16} />
                  Add subloop
                </button>
              </form>

              {loop.children.length ? (
                <div className="subloop-list">
                  {loop.children.map((child) => (
                    <Link className="subloop-card subloop-button" href={`/loops/${child.id}`} key={child.id}>
                      <strong>{child.title}</strong>
                      {child.nextStep ? <span>{child.nextStep}</span> : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">No subloops yet.</p>
              )}
            </section>

            <section className="detail-section-card">
              <p className="eyebrow">Timing</p>
              <div className="control-grid">
                <label className="stacked-field compact-field">
                  <span>Deadline</span>
                  <input type="date" value={dueDateDraft} onChange={(event) => setDueDateDraft(event.target.value)} />
                </label>

                <label className="stacked-field compact-field">
                  <span>Resurface on</span>
                  <input
                    type="date"
                    value={laterUntilDraft}
                    onChange={(event) => setLaterUntilDraft(event.target.value)}
                    disabled={loop.status !== "LATER"}
                  />
                </label>
              </div>

              <div className="signal-row">
                <div className="signal-card">
                  <div>
                    <span>Deadline</span>
                    <strong>{loop.dueDate ? `Due ${DATE_FORMATTER.format(new Date(loop.dueDate))}` : "No deadline set"}</strong>
                  </div>
                </div>
                <div className="signal-card">
                  <div>
                    <span>Resurfacing</span>
                    <strong>{loop.laterUntil ? `Returns ${DATE_TIME_FORMATTER.format(new Date(loop.laterUntil))}` : "Not scheduled"}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-actions-row">
                <button className="primary-button" type="button" onClick={() => void saveTiming()} disabled={pending}>
                  <Save size={16} />
                  Save timing
                </button>
                {loop.status !== "LATER" ? (
                  <button className="secondary-button" type="button" onClick={() => setLaterUntilDraft(toDateInputValue(nextMorningIso()))}>
                    Suggest tomorrow morning
                  </button>
                ) : null}
              </div>
            </section>

            <section className="detail-section-card">
              <p className="eyebrow">Notes</p>
              <label className="stacked-field">
                <span>Thread notes</span>
                <textarea rows={8} value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} />
              </label>

              <div className="detail-actions-row">
                <button className="primary-button" type="button" onClick={() => void saveThreadNotes()} disabled={pending}>
                  <Save size={16} />
                  Save notes
                </button>
                <button className="ghost-button danger-button" type="button" onClick={() => void deleteLoop()}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <LoopModal
        defaultDomain={loop.domain}
        isOpen={!!editingLoop}
        loop={editingLoop}
        loops={availableLoops}
        onClose={() => setEditingLoop(null)}
        onSaved={(savedLoop) => {
          setLoop(savedLoop);
          setAvailableLoops((current) => current.map((item) => (item.id === savedLoop.id ? savedLoop : item)));
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
                <h4>{loop.title}</h4>
                <p className="muted-copy">
                  {loop.summary || "Mark this loop complete and keep the thread traceable in Closed."}
                </p>
              </div>

              <div className="completion-summary-grid">
                <div className="signal-card">
                  <div>
                    <span>Checklist</span>
                    <strong>{formatProgress(loop)}</strong>
                  </div>
                </div>
                <div className="signal-card">
                  <div>
                    <span>Subloops</span>
                    <strong>{formatSubloopSummary(loop)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="ghost-button" type="button" onClick={() => setClosingLoop(null)}>
                Keep open
              </button>
              <button className="primary-button" type="button" onClick={() => void closeLoop()} disabled={pending}>
                {pending ? "Closing..." : "Close loop"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function formatProgress(loop: LoopRecord) {
  if (loop.checklistItems.length === 0) {
    return loop.nextStep ? "Next step set" : "No next step";
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

function toIsoDate(value: string) {
  return new Date(value).toISOString();
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}
