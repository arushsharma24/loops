"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { buildLoopPayload, type LoopDomain, type LoopPayload, type LoopRecord } from "@/lib/loop-record";

const types = [
  { label: "Task", value: "ACTION" },
  { label: "Thought", value: "THOUGHT" },
  { label: "Routine", value: "ROUTINE" },
  { label: "Reference", value: "REFERENCE" },
] as const;

const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

export function LoopModal({
  defaultDomain = "WORK",
  isOpen,
  loop,
  loops,
  onClose,
  onSaved,
}: {
  defaultDomain?: Exclude<LoopDomain, "ALL">;
  isOpen: boolean;
  loop?: LoopRecord | null;
  loops?: LoopRecord[];
  onClose: () => void;
  onSaved?: (loop: LoopRecord) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof types)[number]["value"]>("ACTION");
  const [priority, setPriority] = useState<(typeof priorities)[number]>("MEDIUM");
  const [domain, setDomain] = useState<"WORK" | "PERSONAL">("WORK");
  const [status, setStatus] = useState<"ACTIVE" | "WAITING" | "LATER" | "CLOSED">("ACTIVE");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [summary, setSummary] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const parsedTags = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (loop) {
      setTitle(loop.title);
      setType(loop.type);
      setPriority(loop.priority);
      setDomain(loop.domain);
      setStatus(loop.status);
      setDueDate(loop.status === "LATER" ? toDateInputValue(loop.laterUntil) : toDateInputValue(loop.dueDate));
      setTags(loop.tags.join(", "));
      setSummary(loop.summary || "");
      setNextStep(loop.nextStep || "");
      setParentId(loop.parentId || "");
    } else {
      setTitle("");
      setType("ACTION");
      setPriority("MEDIUM");
      setDomain(defaultDomain);
      setStatus("ACTIVE");
      setDueDate("");
      setTags("");
      setSummary("");
      setNextStep("");
      setParentId("");
    }

    setPending(false);
    setError("");
  }, [defaultDomain, isOpen, loop]);

  if (!isOpen) {
    return null;
  }

  async function saveLoop() {
    setPending(true);
    setError("");

    const payload: LoopPayload = loop
      ? buildLoopPayload(loop, {
          title,
          summary: summary || null,
          domain,
          type,
          status,
          priority,
          parentId: parentId || null,
          nextStep: nextStep || null,
          notes: loop.notes,
          dueDate: status === "LATER" ? null : dueDate ? toIsoDate(dueDate) : null,
          laterUntil: status === "LATER" && dueDate ? toIsoDate(dueDate) : loop.laterUntil,
          tags: parsedTags,
          pinned: priority === "URGENT" || loop.pinned,
          isCurrent: loop.isCurrent,
        })
      : {
          title,
          summary: summary || null,
          domain,
          type,
          status,
          priority,
          parentId: parentId || null,
          nextStep: nextStep || null,
          notes: summary || null,
          dueDate: status === "LATER" ? null : dueDate ? toIsoDate(dueDate) : null,
          reminderAt: null,
          laterUntil: status === "LATER" && dueDate ? toIsoDate(dueDate) : null,
          tags: parsedTags,
          pinned: priority === "URGENT",
          isCurrent: status === "ACTIVE",
          checklistItems: [],
        };

    const response = await fetch(loop ? `/api/loops/${loop.id}` : "/api/loops", {
      method: loop ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to save loop.");
      return;
    }

    onSaved?.(data.loop);
    if (!onSaved) {
      onClose();
      window.location.reload();
      return;
    }
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !title.trim()) {
      return;
    }

    await saveLoop();
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-backdrop" onClick={onClose} />
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-loop-title">
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="brand-mark modal-mark">L</div>
            <h3 id="new-loop-title">{loop ? "Edit Loop" : "New Loop"}</h3>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="stacked-field">
              <span>What needs to get done?</span>
              <input
                autoFocus
                placeholder="What needs to get done?"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <div className="pill-row">
              {types.map((option) => (
                <button
                  className={clsx("choice-pill", option.value === type && "is-active")}
                  key={option.value}
                  onClick={() => setType(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="stacked-field">
              <span>Priority</span>
              <div className="pill-row">
                {priorities.map((option) => (
                  <button
                    className={clsx("choice-pill", priority === option && "is-dark")}
                    key={option}
                    onClick={() => setPriority(option)}
                    type="button"
                  >
                    {option[0] + option.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </label>

            <div className="split-grid">
              <label className="stacked-field">
                <span>Deadline</span>
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>

              <label className="stacked-field">
                <span>Tags</span>
                <input
                  placeholder="work, idea, urgent"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
            </div>

            <div className="split-grid">
              <label className="stacked-field">
                <span>Domain</span>
                <select value={domain} onChange={(event) => setDomain(event.target.value as "WORK" | "PERSONAL")}>
                  <option value="WORK">Work</option>
                  <option value="PERSONAL">Personal</option>
                </select>
              </label>

              <label className="stacked-field">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as "ACTIVE" | "WAITING" | "LATER" | "CLOSED")}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="WAITING">Waiting</option>
                  <option value="LATER">Later</option>
                  {loop ? <option value="CLOSED">Closed</option> : null}
                </select>
              </label>
            </div>

            <label className="stacked-field">
              <span>Parent loop</span>
              <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
                <option value="">None</option>
                {(loops || [])
                  .filter((candidate) => candidate.id !== loop?.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.title}
                    </option>
                  ))}
              </select>
            </label>

            <label className="stacked-field">
              <span>Next useful step</span>
              <input
                placeholder="Write the immediate next move"
                value={nextStep}
                onChange={(event) => setNextStep(event.target.value)}
              />
            </label>

            <label className="stacked-field">
              <span>Summary</span>
              <textarea
                placeholder="Add lightweight context for the thread"
                rows={4}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>

            {error ? <div className="banner banner-error">{error}</div> : null}
          </div>

          <div className="modal-footer">
            <button className="ghost-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={pending || !title.trim()}>
              {pending ? (loop ? "Saving..." : "Opening...") : loop ? "Save Changes" : "Open Loop"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function toIsoDate(value: string) {
  return new Date(value).toISOString();
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }
  return new Date(value).toISOString().slice(0, 10);
}
