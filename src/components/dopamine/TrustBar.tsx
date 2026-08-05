"use client";

import { ShieldCheck, Star, Users, DollarSign, Clock } from "lucide-react";

export function TrustBar() {
    return (
        <div className="surface-well-lg flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <ShieldCheck size={11} className="icon-trust-success" />
                <span>100% Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Star size={11} className="text-accent fill-accent" />
                <span>4.9/5 Rating (2,400+ reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Users size={11} className="icon-trust-info" />
                <span>10,000+ Active Members</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <DollarSign size={11} className="icon-trust-success" />
                <span>$2.4M+ Earned by Community</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Clock size={11} className="icon-trust-warning" />
                <span>24/7 Live Support</span>
            </div>
        </div>
    );
}
