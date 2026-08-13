"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Link2, Search } from "lucide-react";

export type LinkOption = {
    id: string;
    name: string;
    url: string;
};

type LinkComboboxProps = {
    links: LinkOption[];
    value: string;
    onChange: (linkId: string) => void;
};

function truncateUrl(url: string, max = 42) {
    if (url.length <= max) return url;
    return `${url.slice(0, max - 1)}…`;
}

export function LinkCombobox({ links, value, onChange }: LinkComboboxProps) {
    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = links.find((link) => link.id === value) || null;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return links;
        return links.filter(
            (link) =>
                link.name.toLowerCase().includes(q) ||
                link.url.toLowerCase().includes(q),
        );
    }, [links, query]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const pick = (linkId: string) => {
        onChange(linkId);
        setOpen(false);
        setQuery("");
    };

    return (
        <div ref={rootRef} className="relative space-y-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor={`${listId}-trigger`}>
                Use a saved link
            </label>
            <button
                id={`${listId}-trigger`}
                type="button"
                className="input-base flex w-full items-center gap-2 text-left"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <Link2 size={14} className="shrink-0 text-[var(--gold-text)]" />
                <span className="min-w-0 flex-1 truncate">
                    {selected ? (
                        <>
                            <span className="font-medium text-text-primary">{selected.name}</span>
                            <span className="ml-2 text-text-muted">{truncateUrl(selected.url)}</span>
                        </>
                    ) : (
                        <span className="text-text-muted">Paste manually below…</span>
                    )}
                </span>
                <ChevronDown size={16} className={`shrink-0 text-text-muted transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open ? (
                <div className="dfy-link-combobox absolute z-30 mt-1 w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[var(--elevation-3)]">
                    <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
                        <Search size={14} className="text-text-muted" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or URL…"
                            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                        />
                    </div>
                    <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
                        <li>
                            <button
                                type="button"
                                role="option"
                                aria-selected={!value}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-3)]"
                                onClick={() => pick("")}
                            >
                                <span className="w-4 shrink-0">
                                    {!value ? <Check size={14} className="text-[var(--gold-text)]" /> : null}
                                </span>
                                <span className="text-text-secondary">Paste manually below…</span>
                            </button>
                        </li>
                        {filtered.length === 0 ? (
                            <li className="px-3 py-3 text-sm text-text-muted">No matching links.</li>
                        ) : (
                            filtered.map((link) => (
                                <li key={link.id}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={value === link.id}
                                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-3)]"
                                        onClick={() => pick(link.id)}
                                    >
                                        <span className="mt-0.5 w-4 shrink-0">
                                            {value === link.id ? (
                                                <Check size={14} className="text-[var(--gold-text)]" />
                                            ) : null}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium text-text-primary">
                                                {link.name}
                                            </span>
                                            <span className="block truncate text-xs text-text-muted">
                                                {link.url}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
