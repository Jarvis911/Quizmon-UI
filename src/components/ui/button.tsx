import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 select-none active:translate-y-1 active:shadow-none border-[3px]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground border-black/10 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(0,0,0,0.2)]",
                destructive:
                    "bg-destructive text-white border-black/20 shadow-[0_4px_0_0_rgba(153,27,27,0.8)] hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(153,27,27,0.8)]",
                outline:
                    "bg-white text-slate-700 border-slate-200 shadow-[0_4px_0_0_#e5e7eb] hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#e5e7eb]",
                secondary:
                    "bg-secondary text-secondary-foreground border-black/5 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:bg-secondary/80 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(0,0,0,0.1)]",
                ghost:
                    "border-transparent hover:bg-accent hover:text-accent-foreground active:translate-y-0 active:shadow-none hover:-translate-y-0",
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
