"use client";
// app/components/ApprovalDetails/Pagination.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalFilteredCount: number;
    entriesPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalFilteredCount,
    entriesPerPage,
    onPageChange
}) => {
    if (totalPages <= 1 && totalFilteredCount <= entriesPerPage) return null;

    const pageNumbers: number[] = [];
    // Show up to 5 page numbers around the current page
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if we hit the end
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = totalFilteredCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
    const currentEnd = Math.min(indexOfLastEntry, totalFilteredCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 p-3 sm:p-4 bg-white rounded-xl shadow-lg border border-gray-100 space-y-3 sm:space-y-0 animate-in slide-in-from-bottom-2 duration-500">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing <span className="font-semibold">{indexOfFirstEntry}</span>–<span className="font-semibold">{currentEnd}</span> of <span className="font-semibold">{totalFilteredCount}</span> entries
            </div>

            <nav className="flex flex-wrap justify-center sm:justify-end gap-1" aria-label="Pagination">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition duration-150 ${currentPage === number
                            ? 'bg-indigo-600 text-white shadow-md scale-105'
                            : 'text-gray-700 bg-gray-50 hover:bg-indigo-100'
                            }`}
                    >
                        {number}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </nav>
        </div>
    );
};

export default Pagination;