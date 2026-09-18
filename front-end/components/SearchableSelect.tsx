"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

interface SearchableSelectProps {
  value?: any;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({ value, onChange, options, placeholder, disabled, className }: SearchableSelectProps) {
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
          className={cn("w-full justify-between h-9 text-left font-normal text-xs", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder || "..."}`} className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {(options || []).map((o) => (
                <CommandItem
                  key={String(o.value)}
                  value={o.label}
                  onSelect={() => {
                    onChange(String(o.value));
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", String(value) === String(o.value) ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}