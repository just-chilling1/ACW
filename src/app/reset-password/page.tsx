"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertTriangle, Mail } from "lucide-react";
import Image from "next/image";
import { FloatingSupportButton } from "@/components/support/FloatingSupportButton";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [checking, setChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlError = urlParams.get("error");
            if (urlError) {
                setError(urlError);
                setChecking(false);
                return;
            }

            const tokenHash = urlParams.get("token_hash");
            const type = urlParams.get("type");
            if (tokenHash && type === "recovery") {
                try {
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: "recovery",
                    });
                    if (verifyError) {
                        setError(verifyError.message);
                    } else {
                        setReady(true);
                    }
                } catch {
                    setError("Failed to verify reset link. Please request a new one.");
                }
                setChecking(false);
                return;
            }

            const code = urlParams.get("code");
            if (code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
                        setError(exchangeError.message);
                    } else {
                        setReady(true);
                    }
                } catch {
                    setError("Failed to verify reset code. Please request a new link.");
                }
                setChecking(false);
                return;
            }

            const hash = window.location.hash.substring(1);
            const hashParams = new URLSearchParams(hash);

            const hashError = hashParams.get("error_description");
            if (hashError) {
                setError(hashError.replace(/\+/g, " "));
                setChecking(false);
                return;
            }

            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
                try {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) {
                        setError(sessionError.message);
                    } else {
                        setReady(true);
                    }
                } catch {
                    setError("Failed to verify reset link. Please request a new one.");
                }
                setChecking(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setReady(true);
            } else {
                setError("No active reset session. Please request a new password reset link.");
            }
            setChecking(false);
        };

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true);
                setChecking(false);
                setError(null);
            }
        });

        init();
        return () => { listener.subscription.unsubscribe(); };
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                await supabase.auth.signOut();
                setTimeout(() => router.push("/login"), 3000);
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (checking) {
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-text-secondary">Verifying your reset link...</p>
                </div>
            );
        }

        if (success) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-5 py-4"
                >
                    <div className="success-icon-well">
                        <CheckCircle2 size={32} />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-sm text-text-primary font-semibold">Password updated!</p>
                        <p className="text-xs text-text-secondary">Redirecting you to login...</p>
                    </div>
                </motion.div>
            );
        }

        if (!ready) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-5 py-4"
                >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--danger-border)] bg-[var(--danger-bg-subtle)]">
                        <AlertTriangle size={32} className="text-[var(--danger)]" />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-sm text-text-primary font-semibold">Link Expired or Invalid</p>
                        <p className="text-xs text-text-secondary leading-relaxed max-w-xs">
                            {error || "This password reset link has expired or is invalid. Please request a new one."}
                        </p>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                    >
                        <Mail size={16} />
                        Request New Reset Link
                    </Link>
                </motion.div>
            );
        }

        return (
            <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="error-banner"
                    >
                        <span>{error}</span>
                    </motion.div>
                )}

                <Field
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="[&_input]:pl-12"
                    trailing={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-text-muted hover:text-accent transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    }
                />

                <Field
                    label="Confirm Password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="[&_input]:pl-12"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-2 group relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? "Updating..." : (
                            <>
                                <Lock size={18} />
                                Update Password
                            </>
                        )}
                    </span>
                </button>
            </form>
        );
    };

    return (
        <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-x-hidden">
            <FloatingSupportButton />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <Card padding="none" className="flex flex-col gap-8 p-10!">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Image
                            src="/logo.png"
                            alt="AI CashWave"
                            width={220}
                            height={48}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                        <div className="flex flex-col">
                            <h1 className="ds-h1">
                                {success ? "Password Updated" : ready ? "New Password" : checking ? "Verifying..." : "Reset Password"}
                            </h1>
                            <p className="text-sm text-text-secondary mt-1">
                                {success ? "You can now log in with your new password" : ready ? "Enter your new password below" : checking ? "Please wait..." : ""}
                            </p>
                        </div>
                    </div>

                    {renderContent()}

                    {(ready || checking) && !success && (
                        <div className="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-6">
                            <Link
                                href="/login"
                                className="text-xs text-text-muted hover:text-accent transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </Card>

                <div className="mt-6 flex items-center justify-center gap-1 text-xs text-text-secondary">
                    <ShieldCheck size={10} className="icon-trust-success" />
                    <span>256-bit Encrypted</span>
                </div>
            </motion.div>
        </div>
    );
}
