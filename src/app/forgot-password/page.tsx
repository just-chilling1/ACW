"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Mail, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { FloatingSupportButton } from "@/components/support/FloatingSupportButton";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `https://cashtapaiaccess.com/auth/callback?next=/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setSent(true);
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-bg min-h-dvh flex items-center justify-center p-6 relative overflow-x-hidden">
            <FloatingSupportButton />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="card-base flex flex-col gap-8 p-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Image
                            src="/logo.png"
                            alt="CashTap AI"
                            width={220}
                            height={48}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                        <div className="flex flex-col">
                            <h1 className="ds-h1">Reset Password</h1>
                            <p className="text-sm text-text-secondary mt-1">
                                {sent
                                    ? "Check your inbox for the reset link"
                                    : "Enter your email and we'll send you a reset link"}
                            </p>
                        </div>
                    </div>

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-5 py-4"
                        >
                            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-green-400" />
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <p className="text-sm text-text-primary font-semibold">Reset link sent!</p>
                                <p className="text-xs text-text-secondary leading-relaxed max-w-xs">
                                    We sent a password reset link to <strong className="text-text-primary">{email}</strong>. Check your inbox and spam folder.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleReset} className="flex flex-col gap-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm flex items-center gap-3 text-red-400 text-sm"
                                >
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="input-base w-full pl-12"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full mt-2 group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? "Sending..." : (
                                        <>
                                            <Mail size={18} />
                                            Send Reset Link
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    )}

                    <div className="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-6">
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Back to Login
                        </Link>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-1 text-[10px] text-text-muted">
                    <ShieldCheck size={10} className="text-green-400" />
                    <span>256-bit Encrypted</span>
                </div>
            </motion.div>
        </div>
    );
}
