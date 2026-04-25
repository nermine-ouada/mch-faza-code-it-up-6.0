import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-semibold text-ocean-900 shadow-soft outline-none transition placeholder:text-ocean-400 focus:border-ocean-300 focus:ring-2 focus:ring-ocean-200 dark:border-white/10 dark:bg-white/10 dark:text-ocean-50 dark:placeholder:text-ocean-300/60 dark:focus:ring-ocean-700",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
