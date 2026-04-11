import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

const GRADIENT_COLORS = [
  "from-[#2563eb] to-[#6366f1]",
  "from-[#10b981] to-[#06b6d4]",
  "from-[#f59e0b] to-[#ef4444]",
  "from-[#8b5cf6] to-[#ec4899]",
  "from-[#6366f1] to-[#8b5cf6]",
];

function getGradient(name?: string | null): string {
  if (!name) return GRADIENT_COLORS[0];
  const index = name.charCodeAt(0) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[index];
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const cleaned = name.replace("Dr. ", "").replace("Dr ", "").trim();
  const parts = cleaned.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function Avatar({ className, src, name, size = "md", online, ...props }: AvatarProps) {
  const gradient = getGradient(name);
  const initials = getInitials(name);

  return (
    <div
      className={clsx(
        "relative rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden",
        {
          "w-6 h-6": size === "xs",
          "w-8 h-8": size === "sm",
          "w-10 h-10": size === "md",
          "w-14 h-14": size === "lg",
          "w-20 h-20": size === "xl",
        },
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name || "Avatar"} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span
            className={clsx("font-bold text-white leading-none", {
              "text-[10px]": size === "xs",
              "text-xs": size === "sm",
              "text-sm": size === "md",
              "text-base": size === "lg",
              "text-xl": size === "xl",
            })}
          >
            {initials}
          </span>
        </div>
      )}
      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10b981] rounded-full border-2 border-[#0a0a0f]" />
      )}
    </div>
  );
}

export { Avatar };
