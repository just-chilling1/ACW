# Review Package Task 3
Base: cbba7ceeeba8c714f595a5075f82c605c94737ad
Head: d6cf640f14f54af00e938a05e698d4b81d84dcea

## Commits
d6cf640 feat: scroll InlineError into view when it appears

## Stat
 src/components/ui/InlineError.tsx | 52 ++++++++++++++++++++++++++-------------
 1 file changed, 35 insertions(+), 17 deletions(-)

## Diff
```diff
diff --git a/src/components/ui/InlineError.tsx b/src/components/ui/InlineError.tsx index f9562f6..49c9bfd 100644 --- a/src/components/ui/InlineError.tsx +++ b/src/components/ui/InlineError.tsx @@ -1,27 +1,45 @@  "use client";   +import { useEffect, useRef } from "react";  import { AlertCircle } from "lucide-react";  import { clsx } from "clsx";    export function InlineError({ -    message, -    className, +  message, +  className,  }: { -    message: string; -    className?: string; +  message: string; +  className?: string;  }) { -    if (!message) return null; +  const ref = useRef<HTMLDivElement>(null); +  const prevMessage = useRef("");   -    return ( -        <div -            role="alert" -            className={clsx( -                "error-banner items-start", -                className -            )} -        > -            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" /> -            <span className="leading-snug">{message}</span> -        </div> -    ); +  useEffect(() => { +    if (!message) { +      prevMessage.current = ""; +      return; +    } + +    const appeared = prevMessage.current === ""; +    prevMessage.current = message; +    if (!appeared) return; + +    const id = window.requestAnimationFrame(() => { +      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); +    }); +    return () => window.cancelAnimationFrame(id); +  }, [message]); + +  if (!message) return null; + +  return ( +    <div +      ref={ref} +      role="alert" +      className={clsx("error-banner items-start", className)} +    > +      <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" /> +      <span className="leading-snug">{message}</span> +    </div> +  );  }
```
