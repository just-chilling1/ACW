"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, LogIn, ShieldAlert, Eye, EyeOff, Star, Users, DollarSign, ShieldCheck } from "lucide-react";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.push("/dashboard");
            }
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log("Attempting login for:", email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error("Login error:", error);
                setError(error.message);
                setLoading(false);
            } else if (data.user) {
                // Use window.location.href for a hard redirect to ensure middleware picks up cookies
                window.location.href = "/dashboard";
            } else {
                setLoading(false);
            }
        } catch (err: any) {
            console.error("Unexpected login failure:", err);
            setError("An unexpected system error occurred.");
            setLoading(false);
        }
    };

    return (
        <AuthPageLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card padding="none" className="flex flex-col gap-8 p-10!">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <BrandLogo variant="wordmark" size="lg" priority className="mx-auto object-center" />
                        <p className="text-sm text-text-secondary">The AI system for high-converting ad replies</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

                        <div className="flex justify-end -mt-1">
                            <Link
                                href="/forgot-password"
                                className="text-[11px] text-text-muted hover:text-accent transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-2 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? "Logging in..." : (
                                    <>
                                        Log In
                                        <LogIn size={18} />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-8">
                        <p className="text-text-muted text-xs">New here?</p>
                        <Link
                            href="/signup"
                            className="brand-font link-accent text-xs font-bold tracking-wide"
                        >
                            Sign Up
                        </Link>
                    </div>

                    {/* Social Proof on Login */}
                    <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6 mt-2">
                        <div className="flex items-center gap-2 justify-center">
                            <div className="flex -space-x-2">
                                {[
                                    "bg-[var(--accent-bg-medium)]",
                                    "bg-[var(--info-bg-medium)]",
                                    "bg-[var(--warning-bg-medium)]",
                                    "bg-[var(--success-bg-medium)]",
                                    "bg-[var(--danger-bg-medium)]",
                                ].map((c, i) => (
                                    <div key={i} className={`w-7 h-7 ${c} rounded-full border-2 border-[var(--surface-1)] flex items-center justify-center text-[8px] font-black text-text-primary`}>
                                        {["SM", "JR", "ML", "DR", "AK"][i]}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[11px] text-text-secondary font-medium ml-1">
                                <strong className="text-success">2,847</strong> members active now
                            </span>
                        </div>
                        <div className="flex items-center gap-4 justify-center text-xs text-text-secondary">
                            <div className="flex items-center gap-1">
                                <DollarSign size={10} className="icon-trust-success" />
                                <span>$47K+ earned this month</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star size={10} className="text-accent fill-accent" />
                                <span>4.9/5 rating</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <div className="flex items-center gap-1">
                            <ShieldCheck size={10} className="icon-trust-success" />
                            <span>256-bit Encrypted</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users size={10} className="icon-trust-info" />
                            <span>10,000+ users</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AuthPageLayout>
    );
}
