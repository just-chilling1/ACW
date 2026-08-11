"use client";

import { Sparkles } from "lucide-react";

interface WhatNextButtonProps {
  onClick: () => void;
}

export function WhatNextButton({ onClick }: WhatNextButtonProps) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 md:bottom-6">
      <button
        type="button"
        onClick={onClick}
        className="btn-primary shadow-lg px-6 py-3.5"
      >
        <Sparkles size={16} />
        What should I do next?
      </button>
    </div>
  );
}
