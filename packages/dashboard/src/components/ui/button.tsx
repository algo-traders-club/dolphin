import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium tracking-slightly-tight transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:font-medium-dark text-rendering-optimizeLegibility",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary/90 text-white shadow-sm hover:shadow-md hover:from-primary/95 hover:to-primary/85 dark:from-primary dark:to-primary/80 dark:hover:from-primary/95 dark:hover:to-primary/75",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/90 text-white shadow-sm hover:shadow-md hover:from-destructive/95 hover:to-destructive/85 focus-visible:ring-destructive/20 dark:from-destructive dark:to-destructive/80 dark:focus-visible:ring-destructive/30",
        outline:
          "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:shadow-md dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/90 text-white shadow-sm hover:shadow-md hover:from-secondary/95 hover:to-secondary/85 dark:from-secondary dark:to-secondary/80 dark:hover:from-secondary/95 dark:hover:to-secondary/75",
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
        link: "text-primary underline-offset-4 hover:underline dark:text-primary/90",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-7 has-[>svg]:px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
