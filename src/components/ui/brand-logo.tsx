import Image from "next/image";
import { clsx } from "clsx";
import { APP_NAME, LOGO_MARK, LOGO_WORDMARK } from "@/lib/brand";

export type BrandLogoVariant = "wordmark" | "mark";
export type BrandLogoSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BrandLogoSize, Record<BrandLogoVariant, string>> = {
  xs: {
    wordmark: "h-7 w-auto max-w-[9.5rem]",
    mark: "h-8 w-auto",
  },
  sm: {
    wordmark: "h-8 w-auto max-w-[11rem]",
    mark: "h-9 w-auto",
  },
  md: {
    wordmark: "h-10 w-auto max-w-[13rem]",
    mark: "h-10 w-auto",
  },
  lg: {
    wordmark: "h-12 w-auto max-w-[15rem]",
    mark: "h-11 w-auto",
  },
};

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "wordmark",
  size = "sm",
  className,
  priority = false,
}: BrandLogoProps) {
  const asset = variant === "mark" ? LOGO_MARK : LOGO_WORDMARK;

  return (
    <Image
      src={asset.src}
      alt={APP_NAME}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={clsx(
        "shrink-0 object-contain object-left",
        SIZE_CLASSES[size][variant],
        className
      )}
    />
  );
}
