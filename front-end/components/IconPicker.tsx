"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X, LayoutGrid } from "lucide-react";

// React.forwardRef() returns an object with $$typeof = Symbol(react.forward_ref)
// Regular function components have typeof === "function"
// We ONLY want PascalCase keys (icon names), not camelCase utilities
const REACT_FORWARD_REF = Symbol.for("react.forward_ref");

const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons)
  .filter((key) => {
    // Must start with uppercase (PascalCase = React component naming convention)
    if (!/^[A-Z]/.test(key)) return false;
    // Skip known non-icon utility exports that crash if rendered directly
    if (key === "LucideIcon" || key === "LucideProps" || key === "Icon" || key === "LucideProvider") return false;

    const val = (LucideIcons as any)[key];
    if (!val) return false;

    // Accept regular function components
    if (typeof val === "function") return true;

    // Accept React.forwardRef objects (modern lucide-react style)
    if (
      typeof val === "object" &&
      val !== null &&
      (val.$$typeof === REACT_FORWARD_REF ||
        typeof val.render === "function" ||
        typeof val.type === "function")
    ) return true;

    return false;
  })
  .sort();

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(60);

  const SelectedIcon = value ? (LucideIcons as any)[value] : null;

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_ICON_NAMES;
    const q = search.trim().toLowerCase();
    return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(60);
  }, [search]);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 60, filtered.length));
        }
      },
      { rootMargin: "100px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    
    return () => observer.disconnect();
  }, [open, filtered.length]);

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setSearch("");
      setVisibleCount(60);
    }
  };

  const visibleIcons = filtered.slice(0, visibleCount);

  return (
    <Popover open={open} onOpenChange={handleClose}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {SelectedIcon ? (
            <SelectedIcon className="h-4 w-4 shrink-0" />
          ) : (
            <LayoutGrid className="h-4 w-4 shrink-0 opacity-40" />
          )}
          <span className="truncate flex-1 text-left">
            {value || "Select an icon…"}
          </span>
          {value && (
            <X
              className="h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] p-0" align="start" side="bottom">
        <div className="flex flex-col">
          {/* Search */}
          <div className="px-3 py-2 border-b">
            <Input
              autoFocus
              placeholder={`Search ${ALL_ICON_NAMES.length} icons…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Result count */}
          <div className="px-3 py-1 text-[10px] text-muted-foreground border-b bg-muted/30">
            {filtered.length.toLocaleString()} icon
            {filtered.length !== 1 ? "s" : ""} found
          </div>

          {/* Scrollable icon grid */}
          <div className="overflow-y-auto max-h-[300px] p-2 relative">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                No icons match &ldquo;{search}&rdquo;
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-1">
                {visibleIcons.map((name) => {
                  const IconComp = (LucideIcons as any)[name];
                  if (!IconComp) return null;
                  const isSelected = name === value;
                  return (
                    <button
                      key={name}
                      title={name}
                      type="button"
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                        setSearch("");
                        setVisibleCount(60);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-[9px] leading-tight transition-all",
                        "hover:bg-accent hover:text-accent-foreground cursor-pointer border border-transparent",
                        isSelected &&
                          "bg-primary text-primary-foreground border-primary shadow-sm"
                      )}
                    >
                      <IconComp className="h-4 w-4 shrink-0" />
                      <span className="truncate w-full text-center">{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {/* Infinite Scroll Loader Target */}
            {visibleCount < filtered.length && (
              <div ref={loaderRef} className="h-10 w-full col-span-6 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin opacity-50" />
              </div>
            )}
          </div>

          {/* Clear button */}
          {value && (
            <div className="border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground h-7"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear selection
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
