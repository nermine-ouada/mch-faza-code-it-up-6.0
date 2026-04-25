import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-ocean-200/70 text-ocean-800 dark:bg-ocean-700/40 dark:text-ocean-100",
        secondary: "bg-sand-200/80 text-sand-800 dark:bg-sand-500/30 dark:text-sand-100",
        destructive: "bg-coral-200/80 text-coral-700 dark:bg-coral-500/30 dark:text-coral-100",
        success: "bg-seaweed-400/30 text-seaweed-600 dark:bg-seaweed-500/30 dark:text-seaweed-400",
        outline: "border border-white/60 bg-white/70 text-ocean-800 dark:border-white/10 dark:bg-white/10 dark:text-ocean-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
