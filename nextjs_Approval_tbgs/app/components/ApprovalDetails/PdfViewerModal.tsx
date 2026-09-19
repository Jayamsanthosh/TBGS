"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    X,
    ChevronLeft,
    ZoomIn,
    ZoomOut,
    Download,
    Printer,
    Loader2,
    Maximize2,
    Minimize2,
    FileText,
    RotateCw,
    RefreshCw,
    Link2,
    Moon,
    Sun,
    Search as SearchIcon,
    ChevronRight,
    Share2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import toast from 'react-hot-toast';

// Reliable worker source for v5+
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfData: string; // Base64 or Blob URL
    title: string;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, pdfData, title }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.5);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
    const [rotation, setRotation] = useState<number>(0);
    const [isNightMode, setIsNightMode] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<{ page: number; matches: number }[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);
    const printIframeRef = useRef<HTMLIFrameElement | null>(null);
    const renderingRef = useRef<boolean>(false);

    // Function to manually render text layer
    const renderTextLayer = useCallback((textContent: any, viewport: any, container: HTMLDivElement) => {
        container.innerHTML = '';
        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '10';

        textContent.items.forEach((item: any) => {
            const tx = pdfjsLib.Util.transform(
                viewport.transform,
                item.transform
            );

            const angle = Math.atan2(tx[1], tx[0]);
            const angleDeg = Math.round(angle * 180 / Math.PI);

            const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
            const fontHeight = fontSize * viewport.scale;

            const span = document.createElement('span');
            span.textContent = item.str;
            span.style.position = 'absolute';
            span.style.left = `${tx[4]}px`;
            span.style.bottom = `${tx[5]}px`;
            span.style.fontSize = `${fontHeight}px`;
            span.style.fontFamily = 'sans-serif';
            span.style.lineHeight = '1';
            span.style.whiteSpace = 'pre';
            span.style.transform = `rotate(${angleDeg}deg)`;
            span.style.transformOrigin = 'left bottom';
            span.style.color = 'transparent';

            container.appendChild(span);
        });

        return container;
    }, []);

    // Function to highlight text in the text layer
    const highlightTextInLayer = useCallback((textLayer: HTMLDivElement, query: string) => {
        if (!query || query.length < 2) return;

        // Remove existing highlights
        const existingHighlights = textLayer.querySelectorAll('.search-highlight');
        existingHighlights.forEach(h => h.remove());

        const spans = textLayer.querySelectorAll('span');

        // Escape special regex characters for matching
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedQuery, 'gi');

        spans.forEach(span => {
            const originalText = span.textContent || '';

            if (searchRegex.test(originalText)) {
                // Reset regex lastIndex
                searchRegex.lastIndex = 0;

                // Create a highlight overlay div
                const highlight = document.createElement('div');
                highlight.className = 'search-highlight';
                highlight.style.position = 'absolute';
                highlight.style.left = span.style.left;
                highlight.style.bottom = span.style.bottom;
                highlight.style.width = `${span.offsetWidth}px`;
                highlight.style.height = `${span.offsetHeight}px`;
                highlight.style.backgroundColor = 'rgba(250, 204, 21, 0.4)';
                highlight.style.mixBlendMode = 'multiply';
                highlight.style.borderRadius = '2px';
                highlight.style.pointerEvents = 'none';
                highlight.style.zIndex = '15';
                highlight.style.transform = span.style.transform;
                highlight.style.transformOrigin = span.style.transformOrigin;

                if (isNightMode) {
                    highlight.style.backgroundColor = 'rgba(250, 204, 21, 0.6)';
                    highlight.style.mixBlendMode = 'screen';
                }

                textLayer.appendChild(highlight);
            }
        });
    }, [isNightMode]);

    const renderPage = useCallback(async (pageNum: number, currentScale: number, currentRotation: number, doc: pdfjsLib.PDFDocumentProxy) => {
        if (!canvasRef.current || !textLayerRef.current) return;

        // Prevent multiple simultaneous renders
        if (renderingRef.current) {
            console.log('Already rendering, skipping...');
            return;
        }

        // Cancel previous render task if it exists
        if (renderTaskRef.current) {
            try {
                renderTaskRef.current.cancel();
            } catch (e) {
                console.log('Error cancelling render task:', e);
            }
            renderTaskRef.current = null;
        }

        renderingRef.current = true;

        try {
            const page = await doc.getPage(pageNum);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            const textLayer = textLayerRef.current;

            if (!context) {
                renderingRef.current = false;
                return;
            }

            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Clear text layer
            textLayer.innerHTML = '';

            // Responsive scale adjustment for mobile
            let effectiveScale = currentScale;
            if (window.innerWidth < 768) {
                effectiveScale = (window.innerWidth - 40) / page.getViewport({ scale: 1 }).width;
            }

            const viewport = page.getViewport({ scale: effectiveScale, rotation: currentRotation });

            // Handle high DPI displays for crisp text
            const dpr = window.devicePixelRatio || 1;
            canvas.height = viewport.height * dpr;
            canvas.width = viewport.width * dpr;
            canvas.style.height = `${viewport.height}px`;
            canvas.style.width = `${viewport.width}px`;

            context.scale(dpr, dpr);

            // Render the PDF page to canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
            };

            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;

            await renderTask.promise;
            renderTaskRef.current = null;

            // Get text content and render text layer manually
            const textContent = await page.getTextContent();
            renderTextLayer(textContent, viewport, textLayer);

            // Apply search highlights if there's a query
            if (searchQuery && searchQuery.length >= 2) {
                highlightTextInLayer(textLayer, searchQuery);
            }

        } catch (error: any) {
            if (error.name !== 'RenderingCancelledException') {
                console.error('Error rendering page:', error);
                toast.error('Failed to render page');
            }
        } finally {
            renderingRef.current = false;
        }
    }, [searchQuery, renderTextLayer, highlightTextInLayer]);

    const handleSearch = useCallback(async () => {
        if (!pdfDoc || !searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            setCurrentSearchIndex(-1);
            // Re-render current page without highlights
            if (pdfDoc) {
                await renderPage(pageNumber, scale, rotation, pdfDoc);
            }
            return;
        }

        setIsSearching(true);
        const results: { page: number; matches: number }[] = [];

        try {
            // Escape special regex characters in the search query
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapedQuery, 'gi');

            // Search through all pages to find matches
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const text = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');

                const matches = (text.match(searchRegex) || []).length;

                if (matches > 0) {
                    results.push({ page: i, matches });
                }
            }

            setSearchResults(results);

            if (results.length > 0) {
                setCurrentSearchIndex(0);
                setPageNumber(results[0].page);
                toast.success(`Found ${results.reduce((acc, r) => acc + r.matches, 0)} matches across ${results.length} pages`);
            } else {
                setCurrentSearchIndex(-1);
                toast.error('No matches found');

                // Re-render current page without highlights
                if (pdfDoc) {
                    await renderPage(pageNumber, scale, rotation, pdfDoc);
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    }, [pdfDoc, searchQuery, renderPage, pageNumber, scale, rotation]);

    const nextSearchMatch = () => {
        if (searchResults.length === 0) return;
        const nextIndex = (currentSearchIndex + 1) % searchResults.length;
        setCurrentSearchIndex(nextIndex);
        setPageNumber(searchResults[nextIndex].page);
    };

    const prevSearchMatch = () => {
        if (searchResults.length === 0) return;
        const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentSearchIndex(prevIndex);
        setPageNumber(searchResults[prevIndex].page);
    };

    // Clear search results when query is cleared
    useEffect(() => {
        if (searchQuery.length < 2 && pdfDoc) {
            setSearchResults([]);
            setCurrentSearchIndex(-1);

            // Debounce the render to avoid too many renders
            const timeoutId = setTimeout(() => {
                renderPage(pageNumber, scale, rotation, pdfDoc);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, pdfDoc, renderPage, pageNumber, scale, rotation]);

    // Handle initial render and updates with debounce
    useEffect(() => {
        if (pdfDoc && !isLoading) {
            const timeoutId = setTimeout(() => {
                renderPage(pageNumber, scale, rotation, pdfDoc);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [pageNumber, scale, rotation, pdfDoc, renderPage, isLoading]);

    useEffect(() => {
        if (!isOpen || !pdfData) return;

        const loadPdf = async () => {
            setIsLoading(true);

            // Cancel any ongoing render
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    console.log('Error cancelling render task:', e);
                }
                renderTaskRef.current = null;
            }

            try {
                let loadingTask;
                if (pdfData.startsWith('blob:') || pdfData.startsWith('http')) {
                    loadingTask = pdfjsLib.getDocument(pdfData);
                } else {
                    // Optimized Base64 to Uint8Array
                    let base64String = pdfData;
                    if (base64String.includes(',')) {
                        base64String = base64String.split(',')[1];
                    }
                    const binaryString = atob(base64String);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    loadingTask = pdfjsLib.getDocument({ data: bytes });
                }

                const doc = await loadingTask.promise;
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setPageNumber(1);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Error loading PDF:', error);
                toast.error('Failed to load PDF document.');
                setIsLoading(false);
            }
        };

        loadPdf();

        // Cleanup function
        return () => {
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    console.log('Error cancelling render task:', e);
                }
                renderTaskRef.current = null;
            }
        };
    }, [isOpen, pdfData]);

    const handleDownload = () => {
        const link = document.createElement('a');
        if (pdfData.startsWith('blob:') || pdfData.startsWith('http')) {
            link.href = pdfData;
        } else {
            let base64String = pdfData;
            if (!base64String.startsWith('data:')) {
                base64String = `data:application/pdf;base64,${pdfData}`;
            }
            link.href = base64String;
        }
        link.download = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
        link.click();
        toast.success('Document exported successfully');
    };

    const handlePrint = useCallback(() => {
        if (!pdfData) {
            toast.error('No PDF data available');
            return;
        }

        const toastId = toast.loading('Preparing document for printing...');

        try {
            // Create blob URL synchronously for faster loading
            const createBlobUrl = (): string => {
                let blob: Blob;

                if (pdfData.startsWith('blob:')) {
                    // If it's already a blob URL, use it directly
                    return pdfData;
                } else if (pdfData.startsWith('http')) {
                    // For HTTP URLs, we need to fetch (can't be synchronous)
                    // This will be handled in the async path
                    throw new Error('HTTP URLs require async fetch');
                } else {
                    // Handle base64 PDF data synchronously
                    let base64String = pdfData;
                    if (base64String.includes(',')) {
                        base64String = base64String.split(',')[1];
                    }

                    // Convert base64 to binary
                    const binaryString = atob(base64String);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    blob = new Blob([bytes], { type: 'application/pdf' });
                    return URL.createObjectURL(blob);
                }
            };

            // Try synchronous approach first (for base64 and blob URLs)
            try {
                const blobUrl = createBlobUrl();

                // Create or reuse hidden iframe
                if (!printIframeRef.current) {
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'absolute';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = 'none';
                    iframe.style.visibility = 'hidden';
                    document.body.appendChild(iframe);
                    printIframeRef.current = iframe;
                }

                const iframe = printIframeRef.current;

                // Set up one-time load handler
                const onIframeLoad = () => {
                    toast.dismiss(toastId);

                    try {
                        if (iframe.contentWindow) {
                            // Focus and print immediately
                            iframe.contentWindow.focus();
                            iframe.contentWindow.print();

                            // Clean up blob URL after print dialog closes
                            setTimeout(() => {
                                if (!blobUrl.startsWith('blob:') && !blobUrl.startsWith('http')) {
                                    URL.revokeObjectURL(blobUrl);
                                }
                            }, 60000);
                        }
                    } catch (error) {
                        console.error('Print trigger error:', error);
                        toast.error('Failed to open print dialog');
                    }

                    iframe.removeEventListener('load', onIframeLoad);
                };

                iframe.addEventListener('load', onIframeLoad);

                // Set src and trigger load
                iframe.src = blobUrl;

                // For browsers that cache PDFs, print may work before load event
                // So we also set a shorter timeout as fallback
                setTimeout(() => {
                    if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
                        try {
                            iframe.contentWindow.print();
                        } catch (e) {
                            // Ignore if already printing
                        }
                    }
                }, 500);

            } catch (error) {
                // Fallback to async approach for HTTP URLs
                console.log('Using async print approach for HTTP URL');

                const fetchAndPrint = async () => {
                    try {
                        const response = await fetch(pdfData);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        if (!printIframeRef.current) {
                            const iframe = document.createElement('iframe');
                            iframe.style.position = 'absolute';
                            iframe.style.width = '0';
                            iframe.style.height = '0';
                            iframe.style.border = 'none';
                            iframe.style.visibility = 'hidden';
                            document.body.appendChild(iframe);
                            printIframeRef.current = iframe;
                        }

                        const iframe = printIframeRef.current;

                        const onIframeLoad = () => {
                            toast.dismiss(toastId);

                            try {
                                if (iframe.contentWindow) {
                                    iframe.contentWindow.focus();
                                    iframe.contentWindow.print();

                                    setTimeout(() => {
                                        URL.revokeObjectURL(blobUrl);
                                    }, 60000);
                                }
                            } catch (error) {
                                console.error('Print trigger error:', error);
                                toast.error('Failed to open print dialog');
                            }

                            iframe.removeEventListener('load', onIframeLoad);
                        };

                        iframe.addEventListener('load', onIframeLoad);
                        iframe.src = blobUrl;

                    } catch (fetchError) {
                        toast.dismiss(toastId);
                        toast.error('Failed to prepare document for printing');
                        console.error('Print preparation error:', fetchError);

                        // Fallback to download
                        handleDownload();
                    }
                };

                fetchAndPrint();
            }

        } catch (error) {
            toast.dismiss(toastId);
            toast.error('Failed to prepare document for printing');
            console.error('Print Error:', error);

            // Fallback to download
            handleDownload();
        }
    }, [pdfData, title]);

    // Clean up iframe on unmount
    useEffect(() => {
        return () => {
            if (printIframeRef.current && document.body.contains(printIframeRef.current)) {
                document.body.removeChild(printIframeRef.current);
            }

            // Cancel any ongoing render
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    console.log('Error cancelling render task:', e);
                }
                renderTaskRef.current = null;
            }
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-100 flex w-full h-screen items-center justify-center bg-slate-900/10 backdrop-blur-sm animate-in fade-in zoom-in duration-300 ${isNightMode ? 'night-mode' : ''}`}>
            <div className={`relative flex flex-col border shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}
                ${isFullScreen ? 'w-full h-full' : 'w-[92vw] h-[88vh] rounded-2xl'}
            `}>

                {/* BALANCED PREMIUM HEADER */}
                <header className={`relative z-20 flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-b shadow-xs transition-colors duration-300 ${isNightMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-indigo-100/50'}`}>
                            <FileText className={`h-5 w-5 ${isNightMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>

                        <div className="flex flex-col">
                            <h2 className={`text-[15px] font-bold tracking-tight leading-none uppercase selection:bg-indigo-100 ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                {title}
                            </h2>
                            <div className="flex items-center space-x-2 mt-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 active-glow"></span>
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Enterprise Intelligence
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center flex-1 max-w-sm mx-4 sm:mx-8 transition-opacity ${isNightMode ? 'opacity-90' : 'opacity-100'}`}>
                        <div className="relative w-full group">
                            <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSearching ? 'text-indigo-500 animate-pulse' : 'text-slate-400'} group-focus-within:text-indigo-500`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                                placeholder="Search document..."
                                className={`w-full h-9 pl-9 pr-24 rounded-lg text-[13px] border transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600 placeholder:text-slate-400'}`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {searchResults.length > 0 && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-white dark:bg-slate-800 rounded-md shadow-sm px-1">
                                    <span className="text-[10px] font-bold text-slate-400 mr-1 whitespace-nowrap">
                                        {currentSearchIndex + 1}/{searchResults.length}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevSearchMatch(); }}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Previous match"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextSearchMatch(); }}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        title="Next match"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-wider"
                                >
                                    Go
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1.5 p-1 rounded-xl transition-colors ${isNightMode ? 'bg-slate-800/40' : 'bg-slate-50/50'}`}>
                            <button
                                onClick={handleDownload}
                                className="h-8 w-8 flex items-center justify-center bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-all shadow-sm active:scale-95"
                                title="Export PDF"
                            >
                                <Download size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="h-8 w-8 flex items-center justify-center bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                                title="Print Document"
                            >
                                <Printer size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(pdfData);
                                    toast.success('Document link copied');
                                }}
                                className="h-8 w-8 flex items-center justify-center bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-all shadow-sm active:scale-95"
                                title="Copy Link"
                            >
                                <Link2 size={16} strokeWidth={2.5} />
                            </button>

                            <div className="h-6 w-px bg-slate-200/20 mx-1"></div>

                            <button
                                onClick={() => setRotation(prev => (prev + 90) % 360)}
                                className={`h-8 w-8 flex items-center justify-center border rounded-md transition-all shadow-xs active:scale-95 ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="Rotate"
                            >
                                <RotateCw size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => setIsNightMode(!isNightMode)}
                                className={`h-8 w-8 flex items-center justify-center border rounded-md transition-all shadow-xs active:scale-95 ${isNightMode ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="Display Mode"
                            >
                                {isNightMode ? <Sun size={16} strokeWidth={2.5} /> : <Moon size={16} strokeWidth={2.5} />}
                            </button>
                            <button
                                onClick={() => {
                                    setScale(1.5);
                                    setRotation(0);
                                    setIsNightMode(false);
                                }}
                                className={`h-8 w-8 flex items-center justify-center border rounded-md transition-all shadow-xs active:scale-95 ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="Reset Viewer"
                            >
                                <RefreshCw size={14} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className={`h-5 w-px mx-1 ${isNightMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

                        <div className="flex items-center space-x-1">
                            <button onClick={() => setIsFullScreen(!isFullScreen)} className={`p-2 rounded-lg transition-all hidden sm:block group active:scale-95 ${isNightMode ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}>
                                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>

                            <button onClick={onClose} className={`p-2 rounded-lg transition-all group active:scale-95 ${isNightMode ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-900/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* BALANCED PRECISION TOOLBAR */}
                <div className={`flex items-center justify-center space-x-8 px-10 py-2.5 border-b backdrop-blur-xs transition-colors duration-300 ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/50 border-slate-100/60'}`}>
                    <div className="flex items-center space-x-2.5">
                        <button
                            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                            disabled={pageNumber <= 1}
                            className={`group p-1.5 border rounded-lg shadow-xs disabled:opacity-20 transition-all active:scale-90 ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-900' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>

                        <div className={`flex items-center h-8 px-3.5 rounded-lg border shadow-xs ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <span className={`text-[13px] font-bold ${isNightMode ? 'text-slate-200' : 'text-slate-900'}`}>{pageNumber}</span>
                            <span className="text-slate-500 mx-2 text-[10px] font-bold">OF</span>
                            <span className={`text-[13px] font-bold ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>{numPages}</span>
                        </div>

                        <button
                            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                            disabled={pageNumber >= numPages}
                            className={`group p-1.5 border rounded-lg shadow-xs disabled:opacity-20 transition-all active:scale-90 ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-900' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                        >
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className={`h-5 w-px ${isNightMode ? 'bg-slate-800' : 'bg-slate-200/60'}`}></div>

                    <div className={`flex items-center p-1 rounded-lg border shadow-xs ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))} className={`p-1.5 rounded-md transition-all ${isNightMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <ZoomOut size={16} />
                        </button>

                        <div className="px-3 flex items-center justify-center min-w-[70px]">
                            <span className={`text-[12px] font-bold font-mono tracking-tighter italic ${isNightMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{Math.round(scale * 100)}%</span>
                        </div>

                        <button onClick={() => setScale(prev => Math.min(prev + 0.25, 4.0))} className={`p-1.5 rounded-md transition-all ${isNightMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <ZoomIn size={16} />
                        </button>
                    </div>
                </div>

                {/* CLEAN VIEWPORT */}
                <main
                    ref={containerRef}
                    className={`flex-1 overflow-auto p-6 flex flex-col items-center relative scroll-smooth CustomScrollbar transition-colors duration-300 ${isNightMode ? 'bg-slate-950' : 'bg-slate-50/50'}`}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <Loader2 size={40} strokeWidth={1.5} className="text-indigo-400 animate-spin" />
                            <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isNightMode ? 'text-slate-600' : 'text-slate-400'}`}>Synchronizing Assets...</p>
                        </div>
                    ) : (
                        <div className={`relative group p-4 rounded-xl border transition-all duration-700 hover:scale-[1.001] ${isNightMode ? 'bg-slate-900 border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.04)]'}`}>
                            <div className="relative">
                                <canvas ref={canvasRef} className="max-w-full h-auto block" />
                                <div
                                    ref={textLayerRef}
                                    className="absolute top-0 left-0 w-full h-full"
                                    style={{
                                        zIndex: 10,
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </main>

            </div>

            <style jsx global>{`
                .CustomScrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .CustomScrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .CustomScrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .CustomScrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(350%); }
                }
                .animate-progress {
                    animation: progress 2.2s infinite cubic-bezier(0.65, 0, 0.35, 1);
                }
                .active-glow {
                    animation: glow 2s ease-in-out infinite;
                }
                @keyframes glow {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                }

                /* Search highlight styles */
                .search-highlight {
                    position: absolute;
                    background-color: rgba(250, 204, 21, 0.4) !important;
                    mix-blend-mode: multiply;
                    border-radius: 2px;
                    pointer-events: none;
                    z-index: 15;
                }
                
                .night-mode .search-highlight {
                    background-color: rgba(250, 204, 21, 0.6) !important;
                    mix-blend-mode: screen;
                }

                /* Text layer spans */
                .textLayer span {
                    color: transparent;
                    position: absolute;
                    white-space: pre;
                    cursor: text;
                    transform-origin: 0% 0%;
                }
            `}</style>
        </div>
    );
};

export default PdfViewerModal;