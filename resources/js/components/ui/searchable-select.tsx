import { Check, ChevronsUpDown, Search } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

type SearchableSelectOption = {
  value: string
  label: string
  keywords?: string
  disabled?: boolean
}

type SearchableSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  )

  const filteredOptions = React.useMemo(() => {
    if (!query.trim()) {
      return options
    }

    const normalizedQuery = query.toLowerCase().trim()

    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords ?? ""}`.toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [options, query])

  const enabledOptions = React.useMemo(
    () => filteredOptions.filter((option) => !option.disabled),
    [filteredOptions]
  )

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) {
        return
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery("")
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      searchInputRef.current?.focus()

      const selectedIndex = enabledOptions.findIndex((option) => option.value === value)
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : enabledOptions.length > 0 ? 0 : -1)
    }
  }, [enabledOptions, open, value])

  React.useEffect(() => {
    if (!open || highlightedIndex < 0) {
      return
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    })
  }, [highlightedIndex, open])

  function handleSelect(option: SearchableSelectOption) {
    if (option.disabled) {
      return
    }

    onValueChange(option.value)
    setOpen(false)
    setQuery("")
    setHighlightedIndex(-1)
  }

  function moveHighlight(direction: 1 | -1) {
    if (enabledOptions.length === 0) {
      setHighlightedIndex(-1)

      return
    }

    setHighlightedIndex((previous) => {
      if (previous < 0) {
        return direction === 1 ? 0 : enabledOptions.length - 1
      }

      return (previous + direction + enabledOptions.length) % enabledOptions.length
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (disabled) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()

      if (!open) {
        setOpen(true)

        return
      }

      moveHighlight(1)

      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()

      if (!open) {
        setOpen(true)

        return
      }

      moveHighlight(-1)

      return
    }

    if (event.key === "Escape") {
      if (open) {
        event.preventDefault()
        setOpen(false)
        setQuery("")
        setHighlightedIndex(-1)
      }

      return
    }

    if (event.key === "Enter" && open) {
      event.preventDefault()

      if (highlightedIndex >= 0) {
        const option = enabledOptions[highlightedIndex]

        if (option) {
          handleSelect(option)
        }
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <button
          type="button"
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (disabled) {
              return
            }

            setOpen((previous) => {
              const next = !previous

              if (!next) {
                setQuery("")
                setHighlightedIndex(-1)
              }

              return next
            })
          }}
          disabled={disabled}
          className={cn(
            "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span
            className={cn(
              "line-clamp-1 text-left",
              !selectedOption && "text-muted-foreground"
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden="true" />
        </button>

        {open && (
          <div className="bg-popover text-popover-foreground border-border absolute top-full left-0 z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border p-1 shadow-md">
            <div className="relative p-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                className="border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full min-w-0 rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder={searchPlaceholder}
              />
            </div>

            {filteredOptions.length === 0 ? (
              <div className="text-muted-foreground px-2 py-2 text-sm">{emptyMessage}</div>
            ) : (
              enabledOptions.map((option, index) => {
                const isSelected = option.value === value
                const isHighlighted = index === highlightedIndex

                return (
                  <button
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element
                    }}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "w-full rounded-sm py-1.5 pr-2 pl-2 text-left text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      isHighlighted && "bg-accent text-accent-foreground",
                      isSelected && "bg-accent/70 text-accent-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Check className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{option.label}</span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { SearchableSelect }
export type { SearchableSelectOption, SearchableSelectProps }
