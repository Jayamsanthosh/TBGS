"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";

interface SearchableSelectProps {
  value?: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export function SearchableSelect({ value, onChange, options, placeholder, disabled, className, searchable = true }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  const selectedLabel = selected ? selected.label : placeholder || "Select...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-9 justify-between text-left font-normal text-xs",
            "bg-card shadow-sm transition-all",
            open
              ? "border-primary/50 ring-2 ring-primary/20"
              : "border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-md",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className={`ml-2 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder={`Search ${placeholder || "..."}`} className="h-9" />}
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {(options || []).map((o) => {
                const isSelected = String(value) === String(o.value);
                return (
                  <CommandItem
                    key={String(o.value)}
                    value={o.label}
                    onSelect={() => {
                      onChange(String(o.value));
                      setOpen(false);
                    }}
                    className={cn("cursor-pointer transition-colors", isSelected && "bg-primary/10 text-primary font-medium")}
                  >
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{o.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}