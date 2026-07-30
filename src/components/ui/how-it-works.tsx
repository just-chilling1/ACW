import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

export interface HowItWorksStep {
    number: number;
    title: string;
    description: string;
    minutes: string;
    href: string;
    icon: LucideIcon;
    cta: string;
}

interface HowItWorksProps {
    steps: HowItWorksStep[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
    return (
        <section className="flex flex-col gap-5">
            <div>
                <h2 className="ds-h2">Here&apos;s how it works</h2>
                <p className="ds-subtitle mt-2">Three steps to find ads, create replies, and earn commissions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={step.number}
                            className="card-base flex h-full flex-col gap-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(234,179,8,0.25)] bg-[rgba(234,179,8,0.08)] text-sm font-semibold text-[var(--gold)]">
                                    {step.number}
                                </div>
                                <span className="rounded-full border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.08)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
                                    {step.minutes}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Icon size={18} className="text-[var(--gold)]" />
                                <h3 className="ds-h3">{step.title}</h3>
                            </div>

                            <p className="text-sm text-text-secondary leading-relaxed flex-1">
                                {step.description}
                            </p>

                            <Link href={step.href} className="btn-primary w-full min-h-[48px] mt-auto">
                                {step.cta}
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 sm:p-5">
                <p className="text-sm text-text-secondary leading-relaxed">
                    That&apos;s it — follow the steps above and paste your replies where people are already talking.
                    If you get stuck, use the Support card below.{" "}
                    <span className="text-text-muted italic">Individual results vary.</span>
                </p>
            </div>
        </section>
    );
}
