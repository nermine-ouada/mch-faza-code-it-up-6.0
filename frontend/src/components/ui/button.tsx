import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-ocean-600 text-white hover:bg-ocean-700 focus-visible:ring-ocean-500",
        destructive:
          "bg-coral-600 text-white hover:bg-coral-700 focus-visible:ring-coral-500",
        outline:
          "border border-white/60 bg-white/70 text-ocean-800 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-ocean-100",
        ghost:
          "text-ocean-800 hover:bg-white/70 dark:text-ocean-100 dark:hover:bg-white/10",
        playful:
          "rounded-full bg-sand-500 px-5 py-2.5 font-heading text-lg text-ocean-900 shadow-sun hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
