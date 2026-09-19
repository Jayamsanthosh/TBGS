"use client";

import React, { useState } from 'react';

interface ExpandableTextProps {
    text: string;
    limit?: number;
    className?: string;
    actionClassName?: string;
    showReadLess?: boolean;
    highlight?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
    text,
    limit = 150,
    className = "",
    actionClassName = "text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300",
    showReadLess = true,
    highlight = ""
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Robustly handle input
    const safeText = (text || "").toString().trim();
    const displayLimit = Number(limit);

    if (!safeText) return null;

    const isLongText = safeText.length > displayLimit;

    // Simple formatter to handle **bold**, *italic*, \n and highlights
    const renderFormattedText = (content: string) => {
        // We combine all delimiters into one regex: **bold**, *italic*, \n, and highlight
        // If highlight is provided, we escape it and add it to the regex
        const escapedHighlight = highlight.trim() ? highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : "";
        const regex = new RegExp(`(\\*\\*.*?\\*\\*|\\*.*?\\*|\\n${escapedHighlight ? `|${escapedHighlight}` : ""})`, "gi");

        const parts = content.split(regex);

        return parts.map((part, index) => {
            if (!part) return null;
            if (part === '\n') {
                return <br key={index} />;
            }
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={index} className="italic">{part.slice(1, -1)}</em>;
            }
            if (escapedHighlight && part.toLowerCase() === highlight.toLowerCase()) {
                return <mark key={index} className="bg-yellow-200 text-slate-900 rounded-sm p-0">{part}</mark>;
            }
            return part;
        });
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    };

    return (
        <div className={`inline ${className}`} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            <span>
                {isExpanded
                    ? renderFormattedText(safeText)
                    : isLongText
                        ? <>{renderFormattedText(safeText.slice(0, displayLimit))}...</>
                        : renderFormattedText(safeText)
                }
            </span>

            {isLongText && (
                <button
                    type="button"
                    onClick={handleToggle}
                    className={`ml-1 font-bold cursor-pointer underline-offset-4 bg-transparent border-none p-0 inline-flex items-center transition-colors focus:outline-none ${actionClassName}`}
                    style={{ fontSize: 'inherit', fontFamily: 'inherit', verticalAlign: 'baseline' }}
                >
                    {isExpanded ? (showReadLess ? " Read less" : "") : " Read more"}
                </button>
            )}
        </div>
    );
};

export default ExpandableText;
