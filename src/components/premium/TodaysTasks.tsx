"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import type { TodayTask } from "@/lib/premium-types";

export function TodaysTasks() {
    const [tasks, setTasks] = useState<TodayTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/premium/tasks")
            .then((r) => r.json())
            .then((d) => setTasks(d.tasks ?? []))
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading || tasks.length === 0) return null;

    return (
        <section className="premium-tasks-strip" aria-label="Today's tasks">
            <div className="flex items-center gap-2 mb-4">
                <ListChecks size={16} className="text-[var(--gold)]" />
                <h2 className="ds-h4">Today&apos;s 3 Tasks</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {tasks.map((task, i) => (
                    <Link
                        key={task.id}
                        href={task.href}
                        className="premium-task-card group"
                    >
                        <span className="premium-task-number">{i + 1}</span>
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-semibold text-text-primary">{task.title}</span>
                            <span className="text-[13px] text-text-secondary line-clamp-2">
                                {task.description}
                            </span>
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--gold)] group-hover:gap-2 transition-all">
                                {task.actionLabel}
                                <ArrowRight size={12} />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
