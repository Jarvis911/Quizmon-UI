import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none active:translate-y-1 active:shadow-none border-[3px]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground border-primary-foreground/30 shadow-[0_4px_0_0_var(--color-primary-foreground)] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--color-primary-foreground)]",
                destructive:
                    "bg-destructive text-white border-black/20 shadow-[0_4px_0_0_rgba(153,27,27,1)] hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(153,27,27,1)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "bg-white text-primary border-primary/20 shadow-[0_4px_0_0_var(--color-primary)] hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--color-primary)] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
                secondary:
                    "bg-secondary text-secondary-foreground border-black/5 shadow-[0_4px_0_0_var(--color-secondary-foreground)] hover:bg-secondary/80 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_var(--color-secondary-foreground)]",
                ghost:
                    "border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:translate-y-0 active:shadow-none hover:-translate-y-0",
                link: "border-transparent text-primary underline-offset-4 hover:underline active:translate-y-0 active:shadow-none hover:-translate-y-0",
            },
            size: {
                default: "h-11 px-6 py-2 has-[>svg]:px-4",
                sm: "h-9 px-4 gap-1.5 has-[>svg]:px-3 text-sm border-2",
                lg: "h-12 px-8 has-[>svg]:px-6 text-lg",
                icon: "size-11",
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

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: ButtonProps) {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
