import { clsx } from "clsx";

export function PlatformBadge({ platform }: { platform: string }) {
  const isReddit = platform === "Reddit";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
        isReddit ? "badge-platform-reddit" : "status-danger",
      )}
    >
      {platform}
    </span>
  );
}
