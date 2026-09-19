"use client";
// app/components/ApprovalDetails/FilterForm.tsx
import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    ChevronDown,
    RefreshCcw,
    X,
    Calendar,
    RotateCcw,
    Loader2
} from "lucide-react";

interface FilterFormProps {
    filters?: Record<string, any>;
    filterOptions?: {
        companies?: any[];
        purchaseTypes?: any[];
        suppliers?: any[];
        departments?: any[];
    };
    onFilterChange?: (filters: Record<string, any>) => void;
    onReset?: () => void;
    onApplyFilters?: (filters: Record<string, any>) => void;
    isLoading?: boolean;
    title?: string;
}

interface InputWrapperProps {
    label: string;
    children: React.ReactNode;
}

/**
 * Filter Form component matching the theme in the provided images.
 */
const FilterForm: React.FC<FilterFormProps> = ({
    filters = {},
    filterOptions = {},
    onFilterChange,
    onReset,
    onApplyFilters,
    isLoading = false,
    title = "Filter Approval Requests"
}) => {
    const [localFilters, setLocalFilters] = useState<Record<string, any>>({ ...filters });
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const {
        companies = [] as any[],
        purchaseTypes = [] as any[],
        suppliers = [] as any[],
        departments = [] as any[]
    } = filterOptions;

    useEffect(() => {
        setLocalFilters({ ...filters });
    }, [filters]);

    const handleChange = (field: string, value: any, autoApply = true) => {
        const updated = { ...localFilters, [field]: value };
        setLocalFilters(updated);

        // Auto-apply if it's a select/date or specific trigger
        if (autoApply) {
            onApplyFilters?.(updated);
            onFilterChange?.(updated);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onApplyFilters?.(localFilters);
            onFilterChange?.(localFilters);
        }
    };

    const handleReset = () => {
        const cleared = Object.keys(localFilters).reduce((acc, key) => ({ ...acc, [key]: "" }), {});
        setLocalFilters(cleared);
        onApplyFilters?.(cleared);
        onReset?.();
    };

    const InputWrapper: React.FC<InputWrapperProps> = ({ label, children }) => (
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[13px] font-bold text-slate-500">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-top-2 duration-500">

            {/* Header */}
            <div className="bg-slate-50/50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-indigo-600">
                    <Filter size={18} className="stroke-[2.5]" />
                    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>
                </div>

                <div className="flex items-center space-x-2">
                    {isLoading && (
                        <div className="flex items-center space-x-2 mr-4">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className="text-[12px] text-slate-400 font-medium">Updating...</span>
                        </div>
                    )}
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        <RotateCcw size={14} />
                        <span>Reset All</span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InputWrapper label="Company">
                        <div className="relative">
                            <select
                                value={localFilters.company || ""}
                                onChange={(e) => handleChange("company", e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">All Companies</option>
                                {companies.map(opt => {
                                    const id = typeof opt === 'object' ? opt.id : opt;
                                    const name = typeof opt === 'object' ? (opt.name || opt.label) : (opt === 'az' ? 'AZ Group' : opt === 'ab' ? 'AB Logistics' : opt);
                                    return <option key={id} value={id}>{name}</option>;
                                })}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </InputWrapper>

                    <InputWrapper label="Purchase Type">
                        <div className="relative">
                            <select
                                value={localFilters.purchaseType || ""}
                                onChange={(e) => handleChange("purchaseType", e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 uppercase"
                            >
                                <option value="">All Types</option>
                                {purchaseTypes.map(val => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </InputWrapper>

                    <InputWrapper label="Supplier">
                        <div className="relative">
                            <select
                                value={localFilters.supplier || ""}
                                onChange={(e) => handleChange("supplier", e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(opt => {
                                    const id = typeof opt === 'object' ? opt.id : opt;
                                    const name = typeof opt === 'object' ? (opt.name || opt.label) : (opt === 'vision' ? 'Vision Infotech' : opt === 'addamo' ? 'Addamo Hardware' : opt);
                                    return <option key={id} value={id}>{name}</option>;
                                })}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </InputWrapper>

                    <InputWrapper label="Department">
                        <div className="relative">
                            <select
                                value={localFilters.department || ""}
                                onChange={(e) => handleChange("department", e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">All Departments</option>
                                {departments.map(opt => {
                                    const id = typeof opt === 'object' ? opt.id : opt;
                                    const name = typeof opt === 'object' ? (opt.name || opt.label) : (opt === 'medical' ? 'AZ Medical' : opt === 'flexible' ? 'Flexible Packaging' : opt);
                                    return <option key={id} value={id}>{name}</option>;
                                })}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </InputWrapper>



                    <InputWrapper label="Search From Date">
                        <div className="relative">
                            <input
                                type="date"
                                value={localFilters.searchFrom || ""}
                                onChange={(e) => handleChange("searchFrom", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </InputWrapper>

                    <InputWrapper label="Search To Date">
                        <div className="relative">
                            <input
                                type="date"
                                value={localFilters.searchTo || ""}
                                onChange={(e) => handleChange("searchTo", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </InputWrapper>

                    <InputWrapper label="PO Roll No">
                        <input
                            type="text"
                            placeholder="Enter PO Roll No"
                            value={localFilters.poRollNo || ""}
                            onChange={(e) => handleChange("poRollNo", e.target.value, false)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                        />
                    </InputWrapper>
                </div>

                {/* Advanced Toggle */}
                <div className="pt-2 border-t border-slate-100">
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="flex items-center space-x-2 text-[14px] font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                        <span>Advanced Filters</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAdvancedOpen && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                            <InputWrapper label="Currency">
                                <select
                                    value={localFilters.currency || ""}
                                    onChange={(e) => handleChange("currency", e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none"
                                >
                                    <option value="">All Currencies</option>
                                    <option value="TSH">TSH</option>
                                    <option value="USD">USD</option>
                                </select>
                            </InputWrapper>
                            <InputWrapper label="Min Amount">
                                <input
                                    type="number"
                                    value={localFilters.minAmount || ""}
                                    onChange={(e) => handleChange("minAmount", e.target.value)} // Auto-apply for simplicity or use handleKeyDown
                                    onKeyDown={handleKeyDown}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none"
                                />
                            </InputWrapper>
                            <InputWrapper label="Max Amount">
                                <input
                                    type="number"
                                    value={localFilters.maxAmount || ""}
                                    onChange={(e) => handleChange("maxAmount", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 outline-none"
                                />
                            </InputWrapper>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterForm;