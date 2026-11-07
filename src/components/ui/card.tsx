import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "glass";
  padding?: "sm" | "md" | "lg" | "none";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-xl transition-all duration-200",
          {
            "bg-[#111118] border border-[#1e2130] shadow-card": variant === "default",
            "bg-[#16161f] border border-[#252838] shadow-card-hover": variant === "elevated",
            "bg-transparent border border-[#1e2130]": variant === "bordered",
            "bg-[#111118]/80 backdrop-blur-md border border-[#252838]/50": variant === "glass",
          },
          {
            "p-3": padding === "sm",
            "p-5": padding === "md",
            "p-6": padding === "lg",
            "p-0": padding === "none",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("flex flex-col space-y-1", className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx("font-semibold text-[#f1f5f9] leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={clsx("text-sm text-[#94a3b8]", className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("pt-0", className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("flex items-center pt-4 border-t border-[#1e2130]", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
