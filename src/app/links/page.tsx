"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    ExternalLink,
    Link2,
    Loader2,
    Pencil,
    Plus,
    Tag,
    Trash2,
    X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { isSafeHttpUrl } from "@/lib/safe-url";

type SavedLink = {
    id: string;
    name: string;
    url: string;
    tag?: string;
    description?: string;
};

type OfferRow = {
    id: string;
    name: string;
    url: string;
    snapshot?: {
        tag?: string;
        description?: string;
    } | null;
};

function toSavedLink(row: OfferRow): SavedLink {
    const snapshot = row.snapshot && typeof row.snapshot === "object" ? row.snapshot : {};
    return {
        id: row.id,
        name: row.name || "Untitled Link",
        url: row.url,
        tag: typeof snapshot.tag === "string" ? snapshot.tag : undefined,
        description: typeof snapshot.description === "string" ? snapshot.description : undefined,
    };
}

function LinkEditorOverlay({
    open,
    initial,
    onClose,
    onSaved,
}: {
    open: boolean;
    initial: SavedLink | null;
    onClose: () => void;
    onSaved: (link: SavedLink) => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [tag, setTag] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        setName(initial?.name ?? "");
        setUrl(initial?.url ?? "");
        setTag(initial?.tag ?? "");
        setDescription(initial?.description ?? "");
        setError(null);
        setSaving(false);
    }, [open, initial]);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [open, saving, onClose]);

    const handleSave = async () => {
        const trimmedUrl = url.trim();
        if (!isSafeHttpUrl(trimmedUrl)) {
            setError("Enter a valid URL starting with https://");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload = {
                id: initial?.id,
                name: name.trim() || "Promotional Offer",
                url: trimmedUrl,
                tag: tag.trim(),
                description: description.trim(),
                snapshot: {
                    ...(tag.trim() ? { tag: tag.trim() } : {}),
                    ...(description.trim() ? { description: description.trim() } : {}),
                },
            };

            const res = await fetch("/api/dfy/offers", {
                method: initial ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not save link.");
            onSaved(toSavedLink(data.offer as OfferRow));
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save link.");
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-editor-title"
        >
            <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={saving ? undefined : onClose}
            />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[var(--elevation-3)]">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
                    <h2 id="link-editor-title" className="ds-h4">
                        {initial ? "Edit Link" : "Create New Link"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-text-muted transition-colors hover:bg-[var(--surface-3)] hover:text-text-primary"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    <Field
                        label="Link Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. My Fitness Offer"
                    />
                    <Field
                        label="URL"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/product?ref=your-id"
                    />
                    <Field
                        label="Tag (optional)"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="Weight Loss"
                    />
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary" htmlFor="link-description">
                            Description <span className="font-normal text-text-muted">(optional)</span>
                        </label>
                        <textarea
                            id="link-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Notes for yourself — niche, network, etc."
                            className="input-base w-full resize-y"
                        />
                    </div>
                    {error ? (
                        <p className="rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg-subtle)] px-3 py-2 text-sm text-[var(--danger)]">
                            {error}
                        </p>
                    ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-4">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button type="button" className="btn-primary" onClick={() => void handleSave()} disabled={saving}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                        {initial ? "Save changes" : "Save link"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default function LinksLibraryPage() {
    const [links, setLinks] = useState<SavedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<SavedLink | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/dfy/offers");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not load links.");
            setLinks(((data.offers || []) as OfferRow[]).map(toSavedLink));
        } catch (err) {
            setLinks([]);
            setError(err instanceof Error ? err.message : "Could not load links.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const openCreate = () => {
        setEditing(null);
        setEditorOpen(true);
    };

    const openEdit = (link: SavedLink) => {
        setEditing(link);
        setEditorOpen(true);
    };

    const handleSaved = (link: SavedLink) => {
        setLinks((prev) => {
            const without = prev.filter((item) => item.id !== link.id && item.url !== link.url);
            return [link, ...without];
        });
    };

    const handleDelete = async (link: SavedLink) => {
        if (!window.confirm(`Delete “${link.name}”?`)) return;
        setDeletingId(link.id);
        setError(null);
        try {
            const res = await fetch("/api/dfy/offers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: link.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not delete link.");
            setLinks((prev) => prev.filter((item) => item.id !== link.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete link.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Links library"
                title="Saved promotion links"
                subtitle="Your affiliate and promo links in one place. Save them here, then pick them in DFY Replies and other tools."
                actions={
                    <button type="button" onClick={openCreate} className="btn-primary text-sm">
                        <Plus size={16} />
                        Create New Link
                    </button>
                }
            />

            {error ? (
                <div className="rounded-[var(--radius-xl)] border border-[var(--danger-border)] bg-[var(--danger-bg-subtle)] px-4 py-3 text-sm text-[var(--danger)]">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
                    <Loader2 size={18} className="animate-spin" />
                    Loading Links Library…
                </div>
            ) : links.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[var(--radius-2xl)] border border-[var(--border-strong)] bg-[var(--surface-1)] px-6 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--gold)]">
                        <Link2 size={22} strokeWidth={1.5} />
                    </div>
                    <h2 className="ds-h4">No links saved yet</h2>
                    <p className="max-w-md text-sm text-text-secondary">
                        Save your first promotional link here — it becomes available when you set up DFY Replies and other premium tools.
                    </p>
                    <button type="button" onClick={openCreate} className="btn-primary mt-1">
                        <Plus size={16} />
                        Create Your First Link
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link) => (
                        <article key={link.id} className="card-base space-y-3 p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)] text-[var(--gold-text)]">
                                        <Link2 size={16} />
                                    </div>
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <p className="truncate font-medium text-text-primary">{link.name}</p>
                                        {link.tag ? (
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                                                <Tag size={10} />
                                                {link.tag}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(link)}
                                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-[var(--accent-bg-faint)] hover:text-[var(--gold-text)]"
                                    >
                                        <Pencil size={14} />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(link)}
                                        disabled={deletingId === link.id}
                                        aria-label={`Delete ${link.name}`}
                                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-[var(--danger-bg-subtle)] hover:text-[var(--danger)] disabled:opacity-50"
                                    >
                                        {deletingId === link.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {link.description ? (
                                <p className="text-sm leading-relaxed text-text-secondary">{link.description}</p>
                            ) : null}

                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-fit max-w-full items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-[var(--gold-text)]"
                            >
                                <span className="truncate">{link.url}</span>
                                <ExternalLink size={12} className="shrink-0" />
                            </a>
                        </article>
                    ))}
                </div>
            )}

            <LinkEditorOverlay
                open={editorOpen}
                initial={editing}
                onClose={() => setEditorOpen(false)}
                onSaved={handleSaved}
            />
        </div>
    );
}
