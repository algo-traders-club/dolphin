"use client"

import * as React from "react"
import { Search as SearchIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  onClear?: () => void
  className?: string
  containerClassName?: string
}

export function Search({
  className,
  containerClassName,
  onSearch,
  onClear,
  ...props
}: SearchProps) {
  const [value, setValue] = React.useState<string>(props.defaultValue?.toString() || "")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleClear = () => {
    setValue("")
    if (onClear) {
      onClear()
    }
    if (onSearch) {
      onSearch("")
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div 
      className={cn(
        "relative flex items-center w-full max-w-md",
        containerClassName
      )}
    >
      <SearchIcon 
        className="absolute left-3 h-4 w-4 text-muted-foreground" 
        aria-hidden="true" 
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 pr-10",
          "text-sm ring-offset-background file:border-0 file:bg-transparent",
          "file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 h-4 w-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
