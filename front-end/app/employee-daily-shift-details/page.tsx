"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchEmployeeDailyShiftDetails,
  addEmployeeDailyShiftDetail,
  updateEmployeeDailyShiftDetail,
  clearEmployeeDailyShiftDetailError,
} from "@/lib/employeeDailyShiftDetailsSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS, YEARS } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const normalizeStatus = (val: any): string => {
  const u = String(val || "").trim().toUpperCase();
  if (u === "AC" || u === "ACTIVE") return "ACTIVE";
  if (u === "IN" || u === "INACTIVE" || u === "IA") return "INACTIVE";
  return String(val || "");
};

const WEEK_DAY_MAP = [
  { id: 1, name: "Sunday" },
  { id: 2, name: "Monday" },
  { id: 3, name: "Tuesday" },
  { id: 4, name: "Wednesday" },
  { id: 5, name: "Thursday" },
  { id: 6, name: "Friday" },
  { id: 7, name: "Saturday" },
];

export default function EmployeeDailyShiftDetailsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.employeeDailyShiftDetails);
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

// Top inputs
  const [empIdInput, setEmpIdInput] = useState("");
  const normalizeMonth = (m?: string): string => {
    if (m) {
      const up = m.trim().toUpperCase();
      const match = MONTHS.find(x => x.value.toUpperCase() === up || x.value.toUpperCase().startsWith(up));
      if (match) return match.value.toUpperCase();
    }
    return new Date().toLocaleString('en', { month: 'long' }).toUpperCase();
  };
  const sessionYear = user?.yearProcess || new Date().getFullYear().toString();
  const sessionMonth = normalizeMonth(user?.monthProcess);
  const [year, setYear] = useState(sessionYear);
  const [month, setMonth] = useState(sessionMonth);
  const [shiftSystemId, setShiftSystemId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [addingAll, setAddingAll] = useState(false);

  const [fullEmp, setFullEmp] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<Set<number>>(new Set());
  const [rowShiftId, setRowShiftId] = useState<Record<string, string>>({});
  const [generateClicked, setGenerateClicked] = useState(false);

  // Master Data
  const { data: companies } = useApiQuery("edsd-companies", async () => {
    const res = await fetch(`${API_URL}/company-master`);
    return (await res.json()).data || [];
  });
  const { data: departments } = useApiQuery("edsd-departments", async () => {
    const res = await fetch(`${API_URL}/department-master`);
    return (await res.json()).data || [];
  });
  const { data: designations } = useApiQuery("edsd-designations", async () => {
    const res = await fetch(`${API_URL}/designation-master`);
    return (await res.json()).data || [];
  });
  const { data: departmentGroups } = useApiQuery("edsd-department-groups", async () => {
    const res = await fetch(`${API_URL}/department-group-master`);
    return (await res.json()).data || [];
  });
  const { data: designationGroups } = useApiQuery("edsd-designation-groups", async () => {
    const res = await fetch(`${API_URL}/designation-group-master`);
    return (await res.json()).data || [];
  });
  const { data: camps } = useApiQuery("edsd-camps", async () => {
    const res = await fetch(`${API_URL}/camp-master`);
    return (await res.json()).data || [];
  });
  const { data: stores } = useApiQuery("edsd-stores", async () => {
    const res = await fetch(`${API_URL}/store-master`);
    const json = await res.json();
    return (json.data || []).map((s: any) => ({
      ...s,
      STORE_ID: s.Store_Id ?? s.STORE_ID,
      STORE_NAME: s.Store_Name ?? s.STORE_NAME,
    }));
  });
  const { data: employmentTypes } = useApiQuery("edsd-employment-types", async () => {
    const res = await fetch(`${API_URL}/employment-type-master`);
    return (await res.json()).data || [];
  });
  const { data: shifts } = useApiQuery("edsd-shifts", async () => {
    const res = await fetch(`${API_URL}/shift-name-master?status=ALL`);
    return (await res.json()).data || [];
  });

  // Fetch emp when empIdInput changes
  useEffect(() => {
    const fetchEmp = async () => {
      if (!empIdInput || empIdInput.trim() === "") {
        setFullEmp(null);
        return;
      }
      try {
        const listRes = await fetch(`${API_URL}/employee-database?status=AC`);
        const listJson = await listRes.json();
        const empGrid = (listJson.data || []).find((e: any) => String(e.EMP_ID) === String(empIdInput));
        if (empGrid && empGrid.SNO) {
          const detailRes = await fetch(`${API_URL}/employee-database/${empGrid.SNO}`);
          const detailJson = await detailRes.json();
          if (detailJson.success && detailJson.data) {
            setFullEmp(detailJson.data);
            return;
          }
        }
        setFullEmp(null);
      } catch (err) {
        console.error(err);
      }
    };
    
    // Add debounce
    const timeout = setTimeout(fetchEmp, 500);
    return () => clearTimeout(timeout);
  }, [empIdInput]);

  useEffect(() => {
    setGenerateClicked(false);
  }, [fullEmp, month, year]);

  useEffect(() => {
    if (fullEmp) {
      dispatch(fetchEmployeeDailyShiftDetails({ empId: String(fullEmp.EMP_ID) }));
    }
  }, [dispatch, fullEmp, month, year]);

  const daysInMonth = useMemo(() => {
    const monthIdx = MONTHS.findIndex(m => m.value.toUpperCase() === String(month).toUpperCase());
    if (monthIdx === -1 || !year) return [];
    const y = parseInt(String(year), 10);
    const numDays = new Date(y, monthIdx + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= numDays; i++) {
      const d = new Date(y, monthIdx, i);
      const mStr = String(month).substring(0, 3);
      days.push({
        dateStr: `${i.toString().padStart(2, '0')}-${mStr}-${y}`,
        dayName: WEEK_DAY_MAP[d.getDay()].name,
        isoDate: new Date(Date.UTC(y, monthIdx, i)).toISOString().split('T')[0],
        dayNumber: i,
      });
    }
    return days;
  }, [month, year]);

  const tableData = useMemo(() => {
    return daysInMonth.map(day => {
      const record = items.find((item: any) => {
        if (!item.SHIFT_DATE) return false;
        // Compare dates ignoring time
        return item.SHIFT_DATE.startsWith(day.isoDate);
      });
      const shiftName =
        record?.SHIFT_NAME ||
        shifts?.find((s: any) => String(s.SHIFT_NAME_ID) === String(record?.SHIFT_NAME_ID))?.SHIFT_NAME ||
        record?.SHIFT_SYSTEM ||
        "";
      return {
        ...day,
        SNO: record?.SNO || "",
        SHIFT: shiftName,
        existingRecord: record,
      };
    });
  }, [daysInMonth, items, shifts]);

  const hasRecordsForMonth = useMemo(() => {
    return items.some((item: any) => 
      String(item.SHIFT_MONTH).toUpperCase() === String(month).toUpperCase() && 
      String(item.SHIFT_YEAR) === String(year)
    );
  }, [items, month, year]);

  const showTable = fullEmp && (hasRecordsForMonth || generateClicked);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDates(new Set(daysInMonth.map(d => d.dayNumber)));
      const defaults: Record<string, string> = {};
      daysInMonth.forEach(d => {
        const rec = items.find((it: any) => it.SHIFT_DATE && it.SHIFT_DATE.startsWith(d.isoDate));
        if (rec && rec.SHIFT_NAME_ID) defaults[String(d.dayNumber)] = String(rec.SHIFT_NAME_ID);
      });
      setRowShiftId(prev => ({ ...defaults, ...prev }));
    } else {
      setSelectedDates(new Set());
      setRowShiftId({});
    }
  };

  const handleSelectRow = (dayNumber: number, checked: boolean) => {
    const newSet = new Set(selectedDates);
    if (checked) {
      newSet.add(dayNumber);
      const day = daysInMonth.find(d => d.dayNumber === dayNumber);
      const rec = day ? items.find((it: any) => it.SHIFT_DATE && it.SHIFT_DATE.startsWith(day.isoDate)) : null;
      if (rec && rec.SHIFT_NAME_ID) {
        setRowShiftId(prev => ({ ...prev, [String(dayNumber)]: String(rec.SHIFT_NAME_ID) }));
      }
    } else {
      newSet.delete(dayNumber);
    }
    setSelectedDates(newSet);
  };

  const handleUpdate = async () => {
    if (!fullEmp) {
      toast({ title: "Please select a valid employee", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (selectedDates.size === 0) {
      toast({ title: "Please select at least one date", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!shiftSystemId && !Object.values(rowShiftId).some(v => v)) {
      toast({ title: "Please select a shift system", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    const promises = Array.from(selectedDates).map(async (dayNumber) => {
      const rowData = tableData.find(d => d.dayNumber === dayNumber);
      if (!rowData) return;

      const rowShift = rowShiftId[String(dayNumber)] || String(rowData.existingRecord?.SHIFT_NAME_ID || "") || String(shiftSystemId || "");
      if (!rowShift) {
        throw new Error("Please select a shift for every chosen date");
      }
      const shiftDef = shifts?.find((s: any) => String(s.SHIFT_NAME_ID) === String(rowShift));
      const shiftSystemStr = shiftDef ? String(shiftDef.SHIFT_NAME || "").slice(0, 10) : "";

      const payload: Record<string, any> = {
        EMP_ID: fullEmp.EMP_ID,
        FIRST_NAME: fullEmp.FIRST_NAME,
        MIDDLE_NAME: fullEmp.MIDDLE_NAME,
        LAST_NAME: fullEmp.LAST_NAME,
        COMPANY_ID: fullEmp.COMPANY_ID,
        DEPARTMENT_ID: fullEmp.DEPARTMENT_ID,
        DESIGNATION_ID: fullEmp.DESIGNATION_ID,
        DEPARTMENT_GROUP_ID: fullEmp.DEPARTMENT_GROUP_ID,
        DESIGNATION_GROUP_ID: fullEmp.DESIGNATION_GROUP_ID,
        CAMP_ID: fullEmp.CAMP_ID,
        STORE_ID: fullEmp.STORE_ID,
        EMPLOYMENT_TYPE_ID: fullEmp.EMPLOYMENT_TYPE_ID,
        SHIFT_MONTH: month,
        SHIFT_YEAR: year,
        SHIFT_DATE: rowData.isoDate,
        SHIFT_WEEK_DAY: rowData.dayName,
        SHIFT_NAME_ID: Number(rowShift),
        SHIFT_SYSTEM: shiftSystemStr,
        REMARKS: remarks || null,
        STATUS_MASTER: "AC",
        USER: user?.loginName || "Admin",
        MAC_ADDRESS: "WEB",
      };

      if (rowData.existingRecord && rowData.SNO) {
        payload.SNO = rowData.SNO;
        return dispatch(updateEmployeeDailyShiftDetail(payload as any)).unwrap();
      } else {
        return dispatch(addEmployeeDailyShiftDetail(payload as any)).unwrap();
      }
    });

    try {
      const results = await Promise.all(promises);
      const lastRes = results[results.length - 1];
      toast({ title: lastRes?.message ?? "Updated successfully", duration: DEFAULT_TOAST_DURATION });
      setSelectedDates(new Set());
      dispatch(fetchEmployeeDailyShiftDetails({ empId: String(fullEmp.EMP_ID) }));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : "Error updating some records", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    }
  };

  const handleClear = () => {
    setSelectedDates(new Set());
    setRowShiftId({});
    setShiftSystemId("");
    setRemarks("");
  };

  const handleAddAllShifts = async () => {
    if (!fullEmp) {
      toast({ title: "Please select a valid employee", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (hasRecordsForMonth) {
      toast({ title: "Shift details already exist for this month", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }
    if (!shiftSystemId) {
      toast({ title: "Please select a shift system", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
      return;
    }

    setAddingAll(true);
    const shiftDef = shifts?.find((s: any) => String(s.SHIFT_NAME_ID) === String(shiftSystemId));
    const shiftSystemStr = shiftDef ? String(shiftDef.SHIFT_NAME || "").slice(0, 10) : "";

    try {
      let lastRes: any = null;
      for (const day of daysInMonth) {
        const existing = tableData.find(d => d.dayNumber === day.dayNumber);
        if (existing && existing.existingRecord) continue;

        const payload: Record<string, any> = {
          EMP_ID: fullEmp.EMP_ID,
          FIRST_NAME: fullEmp.FIRST_NAME,
          MIDDLE_NAME: fullEmp.MIDDLE_NAME,
          LAST_NAME: fullEmp.LAST_NAME,
          COMPANY_ID: fullEmp.COMPANY_ID,
          DEPARTMENT_ID: fullEmp.DEPARTMENT_ID,
          DESIGNATION_ID: fullEmp.DESIGNATION_ID,
          DEPARTMENT_GROUP_ID: fullEmp.DEPARTMENT_GROUP_ID,
          DESIGNATION_GROUP_ID: fullEmp.DESIGNATION_GROUP_ID,
          CAMP_ID: fullEmp.CAMP_ID,
          STORE_ID: fullEmp.STORE_ID,
          EMPLOYMENT_TYPE_ID: fullEmp.EMPLOYMENT_TYPE_ID,
          SHIFT_MONTH: month,
          SHIFT_YEAR: year,
          SHIFT_DATE: day.isoDate,
          SHIFT_WEEK_DAY: day.dayName,
          SHIFT_NAME_ID: Number(shiftSystemId),
          SHIFT_SYSTEM: shiftSystemStr,
          REMARKS: remarks || null,
          STATUS_MASTER: "AC",
          USER: user?.loginName || "Admin",
          MAC_ADDRESS: "WEB",
        };

        lastRes = await dispatch(addEmployeeDailyShiftDetail(payload as any)).unwrap();
      }
      toast({ title: lastRes?.message ?? "Shift details added for all days", duration: DEFAULT_TOAST_DURATION });
      setGenerateClicked(true);
      setSelectedDates(new Set());
      dispatch(fetchEmployeeDailyShiftDetails({ empId: String(fullEmp.EMP_ID) }));
    } catch (e: any) {
      toast({ title: typeof e === 'string' ? e : "Error adding shift details", variant: "destructive", duration: DEFAULT_TOAST_DURATION });
    } finally {
      setAddingAll(false);
    }
  };

  // Helper to format date "DD-MMM-YYYY"
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const m = d.toLocaleString('en', { month: 'short' });
    const y = d.getFullYear();
    const dt = d.getDate().toString().padStart(2, '0');
    return `${dt}-${m}-${y}`;
  };

  const getCompany = (id: any) => companies?.find((c: any) => String(c.COMPANY_ID) === String(id))?.COMPANY_NAME || "-";
  const getDept = (id: any) => departments?.find((c: any) => String(c.DEPARTMENT_ID) === String(id))?.DEPARTMENT_NAME || "-";
  const getDesig = (id: any) => designations?.find((c: any) => String(c.DESIGNATION_ID) === String(id))?.DESIGNATION_NAME || "-";
  const getCamp = (id: any) => camps?.find((c: any) => String(c.CAMP_ID) === String(id))?.CAMP_NAME || "-";
  const getStore = (id: any) => stores?.find((s: any) => String(s.STORE_ID) === String(id))?.STORE_NAME || "-";
  const getDeptGroup = (id: any) => departmentGroups?.find((g: any) => String(g.DEPARTMENT_GROUP_ID) === String(id))?.DEPARTMENT_GROUP_NAME || "-";
  const getDesigGroup = (id: any) => designationGroups?.find((g: any) => String(g.DESIGNATION_GROUP_ID) === String(id))?.DESIGNATION_GROUP_NAME || "-";
  const getEmpType = (id: any) => employmentTypes?.find((t: any) => String(t.EMPLOYMENT_TYPE_ID) === String(id))?.EMPLOYMENT_TYPE_NAME || "-";
  
  return (
    <div className="space-y-4 max-w-full overflow-x-auto pb-8">
      {/* Container to mimic the image style */}
      <div className="border border-border shadow-sm rounded-md bg-background min-w-[900px]">
        <div className="bg-muted p-2 border-b">
          <h2 className="font-bold text-lg text-foreground">Week Off & Shift Details</h2>
        </div>
        
        {/* Top Controls Row */}
        <div className="grid grid-cols-5 gap-0 border-b">
          <div className="p-2 border-r flex flex-col gap-1 bg-muted/20">
            <Label className="text-xs text-muted-foreground font-semibold">EMP ID</Label>
            <Input 
              value={empIdInput} 
              onChange={e => setEmpIdInput(e.target.value)} 
              className={`h-8 rounded-sm text-sm focus-visible:ring-1 ${!empIdInput ? "border-destructive ring-1 ring-destructive/30 border-muted-foreground/30" : "border-muted-foreground/30"}`} 
              placeholder="Enter Emp ID" 
            />
          </div>
          <div className="p-2 border-r flex flex-col gap-1 bg-muted/20">
            <Label className="text-xs text-muted-foreground font-semibold">Year</Label>
            <Select disabled value={String(year)} onValueChange={setYear}>
              <SelectTrigger className="h-8 rounded-sm text-sm border-muted-foreground/30 focus:ring-1 bg-muted dark:bg-background disabled:opacity-50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="p-2 border-r flex flex-col gap-1 bg-muted/20">
            <Label className="text-xs text-muted-foreground font-semibold">Month</Label>
            <Select disabled value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 rounded-sm text-sm border-muted-foreground/30 focus:ring-1 bg-muted dark:bg-background disabled:opacity-50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value.toUpperCase()} value={m.value.toUpperCase()}>{m.label.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="p-2 border-r flex flex-col gap-1 bg-muted/20">
            <Label className="text-xs text-muted-foreground font-semibold">Shift System</Label>
            <Select value={shiftSystemId} onValueChange={setShiftSystemId}>
              <SelectTrigger className="h-8 rounded-sm text-sm border-muted-foreground/30 focus:ring-1 bg-white dark:bg-background"><SelectValue placeholder="Select shift..."/></SelectTrigger>
              <SelectContent>
                {(shifts || []).map((s: any) => (
                  <SelectItem key={String(s.SHIFT_NAME_ID)} value={String(s.SHIFT_NAME_ID)}>
                    {s.SHIFT_NAME}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-2 flex flex-col gap-1 bg-muted/20">
            <Label className="text-xs text-muted-foreground font-semibold">Remarks</Label>
            <div className="flex gap-2">
              <Input 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)} 
                className="h-8 rounded-sm text-sm border-muted-foreground/30 focus-visible:ring-1 flex-1" 
              />
              {fullEmp && !hasRecordsForMonth && !generateClicked && (
                <Button 
                  onClick={handleAddAllShifts}
                  disabled={addingAll}
                  className="h-8 rounded-sm bg-[#1a5f4d] hover:bg-[#1a5f4d]/90 text-white px-3 text-xs whitespace-nowrap disabled:opacity-60"
                >
                  {addingAll ? "Adding..." : "Add Shift"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Employee Details Row */}
        <div className="overflow-x-auto border-b">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#9c0f0f] text-white">
                <th className="p-2 border-r border-white/20 font-semibold">EMP ID</th>
                <th className="p-2 border-r border-white/20 font-semibold">Name</th>
                <th className="p-2 border-r border-white/20 font-semibold">Company</th>
                <th className="p-2 border-r border-white/20 font-semibold">Department</th>
                <th className="p-2 border-r border-white/20 font-semibold">Designation</th>
                <th className="p-2 border-r border-white/20 font-semibold">Camp</th>
                <th className="p-2 border-r border-white/20 font-semibold">Store</th>
                <th className="p-2 border-r border-white/20 font-semibold">Department Group</th>
                <th className="p-2 border-r border-white/20 font-semibold">Designation Group</th>
                <th className="p-2 border-r border-white/20 font-semibold">Employment Type</th>
                <th className="p-2 border-r border-white/20 font-semibold">DOJ</th>
                <th className="p-2 font-semibold">Experiance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-r border-border text-[#4b4ba5] font-medium">{fullEmp?.EMP_ID || "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{[fullEmp?.FIRST_NAME, fullEmp?.MIDDLE_NAME, fullEmp?.LAST_NAME].filter(Boolean).join(" ") || "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getCompany(fullEmp?.COMPANY_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getDept(fullEmp?.DEPARTMENT_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getDesig(fullEmp?.DESIGNATION_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getCamp(fullEmp?.CAMP_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getStore(fullEmp?.STORE_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getDeptGroup(fullEmp?.DEPARTMENT_GROUP_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getDesigGroup(fullEmp?.DESIGNATION_GROUP_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? getEmpType(fullEmp?.EMPLOYMENT_TYPE_ID) : "-"}</td>
                <td className="p-2 border-r border-border text-[#4b4ba5]">{fullEmp ? formatDateStr(fullEmp?.DATE_OF_JOINING) : "-"}</td>
                <td className="p-2 text-[#4b4ba5]">{fullEmp?.RELAVANT_EXPERIENCE ? `${fullEmp.RELAVANT_EXPERIENCE} Years` : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Days Table Section */}
        {showTable && (
          <div className="p-2 bg-background pt-3 pb-6">
            <p className="text-[#a81c3c] text-sm font-semibold mb-2">- {tableData.length} records found "</p>
          
          <div className="inline-block border border-border shadow-sm rounded-sm overflow-hidden">
            <table className="text-xs text-left border-collapse w-full">
              <thead>
                <tr className="bg-[#1a5f4d] text-white">
                  <th className="p-2 border-r border-white/20 w-8 text-center">
                    <Checkbox 
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#1a5f4d]" 
                      checked={selectedDates.size === daysInMonth.length && daysInMonth.length > 0}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                    />
                  </th>
                  <th className="p-2 border-r border-white/20 font-semibold w-24">SNO</th>
                  <th className="p-2 border-r border-white/20 font-semibold w-32">DATE</th>
                  <th className="p-2 border-r border-white/20 font-semibold w-28">DAY</th>
                  <th className="p-2 font-semibold min-w-32">SHIFT</th>
                </tr>
              </thead>
              <tbody className="bg-background">
                {tableData.map((row, idx) => (
                  <tr key={row.dateStr} className={`border-b border-border ${idx % 2 === 0 ? "bg-background" : "bg-muted/30"}`}>
                    <td className="p-2 border-r border-border text-center">
                      <Checkbox 
                        className="rounded-[2px]"
                        checked={selectedDates.has(row.dayNumber)}
                        onCheckedChange={(c) => handleSelectRow(row.dayNumber, !!c)}
                      />
                    </td>
                    <td className="p-2 border-r border-border text-muted-foreground">{row.SNO}</td>
                    <td className="p-2 border-r border-border text-muted-foreground">{row.dateStr}</td>
                    <td className="p-2 border-r border-border text-muted-foreground">{row.dayName}</td>
                    <td className="p-2 font-medium text-muted-foreground">
                      {selectedDates.has(row.dayNumber) ? (
                        <Select
                          value={rowShiftId[String(row.dayNumber)] || String(row.existingRecord?.SHIFT_NAME_ID || "")}
                          onValueChange={(v) => setRowShiftId(prev => ({ ...prev, [String(row.dayNumber)]: v }))}
                        >
                          <SelectTrigger className="h-7 rounded-sm text-xs border-muted-foreground/30 bg-white dark:bg-background min-w-36">
                            <SelectValue placeholder="Select shift..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(shifts || []).map((s: any) => (
                              <SelectItem key={String(s.SHIFT_NAME_ID)} value={String(s.SHIFT_NAME_ID)}>
                                {s.SHIFT_NAME}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        row.SHIFT || "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <Button className="bg-info text-info-foreground hover:bg-info/90 rounded-sm font-semibold h-8" onClick={handleUpdate}>Update</Button>
            <Button variant="outline" className="text-muted-foreground rounded-sm font-semibold h-8" onClick={handleClear}>Clear</Button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
