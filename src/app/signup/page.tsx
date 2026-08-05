"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, UserPlus, ShieldAlert, User, Eye, EyeOff } from "lucide-react";
import { ONBOARDING_META_KEY } from "@/config/onboarding-content";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log("Attempting signup for:", email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/onboarding`,
                    data: {
                        full_name: name,
                        [ONBOARDING_META_KEY]: false,
                    }
                },
            });

            if (error) {
                console.error("Signup error:", error);
                setError(error.message);
                setLoading(false);
            } else {
                const firstName = name.trim().split(/\s+/)[0];
                fetch("https://hook.eu2.make.com/cail6goi5iozkbp9y7vrqksvc58vec91", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ firstName, email }),
                }).catch(() => {});

                if (data.session) {
                    window.location.href = "/onboarding";
                } else {
                    window.location.href = "/login";
                }
            }
        } catch (err: any) {
            console.error("Unexpected signup failure:", err);
            setError("An unexpected system error occurred.");
            setLoading(false);
        }
    };

    return (
        <AuthPageLayout>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <Card padding="none" className="flex flex-col gap-8 p-10!">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <BrandLogo variant="wordmark" size="lg" priority className="mx-auto object-center" />
                        <p className="text-sm text-text-secondary">Join the system built to maximize every click</p>
                    </div>

                    <form onSubmit={handleSignup} className="flex flex-col gap-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="error-banner"
                            >
                                <ShieldAlert size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted ml-1">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full Name"
                                    className="input-base w-full pl-12"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    className="input-base w-full pl-12"
                                />
                            </div>
                        </div>

                        <Field
                            label="Password"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-2 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? "Creating account..." : (
                                    <>
                                        Sign Up
                                        <UserPlus size={18} />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-8">
                        <p className="text-text-muted text-xs">Already have an account?</p>
                        <Link
                            href="/login"
                            className="brand-font link-accent text-xs font-bold tracking-wide"
                        >
                            Log In
                        </Link>
                    </div>
                </Card>

                <div className="mt-8 text-center">
                    <p className="page-eyebrow">
                        Secure Connection Established
                    </p>
                </div>
            </motion.div>
        </AuthPageLayout>
    );
}
