import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://ecomskool.io/wp-content/uploads/2025/11/cropped-cropped-Untitled-270x270.png";

export function Logo({
  size = 36,
  showWordmark = true,
  wordmarkClassName,
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={LOGO_URL}
        alt="EcomSkool"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
      {showWordmark ? (
        <span className={cn("text-lg font-extrabold tracking-tight", wordmarkClassName)}>
          EcomSkool
        </span>
      ) : null}
    </span>
  );
}
