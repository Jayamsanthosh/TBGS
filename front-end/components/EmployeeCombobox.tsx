"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

export function EmployeeCombobox({ value, onChange, options }: { value?: any; onChange: (v: string) => void; options: any[] }) {
  const [open, setOpen] = useState(false);

  const selectedEmp = options.find((e: any) => String(e.EMP_ID) === String(value));
  const selectedLabel = selectedEmp ? `${selectedEmp.FIRST_NAME} ${selectedEmp.LAST_NAME || ""} (#${selectedEmp.EMP_ID})` : "Search Employee...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-9 text-left font-normal", !value && "text-muted-foreground")}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0 pointer-events-auto" align="start">
        <Command>
          <CommandInput placeholder="Search name, ID, camp, dept or store..." className="h-9" />
          <CommandList>
            <CommandEmpty>No matching employee.</CommandEmpty>
            <CommandGroup>
              {options.map((e: any) => {
                const empName = `${e.FIRST_NAME} ${e.LAST_NAME || ""}`.trim();
                const empSearchString = `${empName} (#${e.EMP_ID}) ${e.CAMP_NAME || ""} ${e.DEPARTMENT_NAME || ""} ${e.STORE_NAME || ""}`;
                return (
                  <CommandItem
                    key={e.EMP_ID}
                    value={empSearchString}
                    onSelect={() => {
                      onChange(String(e.EMP_ID));
                      setOpen(false);
                    }}
                    className="flex flex-col items-start py-2"
                  >
                    <div className="flex items-start w-full">
                      <Check className={cn("mr-2 h-4 w-4 mt-0.5 shrink-0", String(value) === String(e.EMP_ID) ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col gap-1.5 w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{empName}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-medium">#{e.EMP_ID}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {e.CAMP_NAME && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 font-medium bg-blue-50 text-blue-700 border-blue-200">
                              Camp: {e.CAMP_NAME}
                            </Badge>
                          )}
                          {e.DEPARTMENT_NAME && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                              Dept: {e.DEPARTMENT_NAME}
                            </Badge>
                          )}
                          {e.STORE_NAME && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 py-0 font-medium bg-amber-50 text-amber-700 border-amber-200">
                              Store: {e.STORE_NAME}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
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