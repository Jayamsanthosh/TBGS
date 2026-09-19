"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ChevronLeft, ChevronRight, ExternalLink, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ViewerFile {
  SNO?: number;
  DMS_ID?: number;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ViewerContent {
  name: string;
  contentType: string;
  dataUrl: string;
}

const dataUrlFrom = (base64: string, contentType: string) =>
  `data:${contentType || "application/octet-stream"};base64,${base64}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | number;
  entityLabel?: string;
  title?: string;
  emptyMessage?: string;
  listUrl: string;
  contentUrlBuilder: (row: ViewerFile) => string;
}

export default function EntityFilesViewerDialog({
  open,
  onOpenChange,
  entityId,
  entityLabel = "",
  title = "Files Viewer",
  emptyMessage = "No files attached",
  listUrl,
  contentUrlBuilder,
}: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<ViewerFile[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewing, setViewing] = useState<ViewerContent | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFiles([]);
    setViewing(null);
    setCurrentIndex(0);
    setListLoading(true);
    fetch(listUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch files");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setFiles(json?.data || []);
      })
      .catch((e: any) => {
        if (cancelled) return;
        toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to load files" });
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, listUrl, toast]);

  useEffect(() => {
    if (!open || !files.length) {
      setViewing(null);
      return;
    }
    const safeIndex = Math.max(0, Math.min(currentIndex, files.length - 1));
    const current = files[safeIndex];
    setContentLoading(true);
    let cancelled = false;
    fetch(contentUrlBuilder(current))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const data = json?.data;
        if (data?.CONTENT_DATA) {
          setViewing({
            name: data.FILE_NAME || current.FILE_NAME || "file",
            contentType: data.CONTENT_TYPE || "application/octet-stream",
            dataUrl: dataUrlFrom(data.CONTENT_DATA, data.CONTENT_TYPE),
          });
        } else {
          setViewing(null);
          toast({ variant: "destructive", title: "File content not available" });
        }
      })
      .catch((e: any) => {
        if (cancelled) return;
        setViewing(null);
        toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to load file" });
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, files, currentIndex, contentUrlBuilder, toast]);

  const goTo = (index: number) => {
    if (!files.length) return;
    setCurrentIndex(Math.max(0, Math.min(index, files.length - 1)));
  };

  const current = useMemo(() => files[currentIndex] || null, [files, currentIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            {title}
            {entityLabel && <span className="text-xs font-normal text-muted-foreground">— {entityLabel}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {listLoading ? (
            <div className="w-full space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200/80 rounded-[16px] bg-slate-50/30">
              <FileText className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-medium">{emptyMessage} · {entityId}</p>
            </div>
          ) : (
            <>
              <div className="w-full lg:w-64 lg:max-h-full shrink-0 border rounded-lg overflow-y-auto">
                {files.map((f, idx) => {
                  const active = idx === currentIndex;
                  return (
                    <button
                      key={String(f.SNO ?? f.DMS_ID ?? idx)}
                      onClick={() => goTo(idx)}
                      className={`w-full text-left px-3 py-2.5 border-b last:border-b-0 transition-colors ${
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{f.FILE_NAME || `File ${idx + 1}`}</p>
                          {f.DOCUMENT_TYPE && <p className="text-[10px] text-muted-foreground truncate">{f.DOCUMENT_TYPE}</p>}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {idx + 1} of {files.length} · {f.CONTENT_TYPE || "—"}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    File <span className="text-foreground">{currentIndex + 1}</span> of {files.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={currentIndex === 0}
                      onClick={() => goTo(currentIndex - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={currentIndex === files.length - 1}
                      onClick={() => goTo(currentIndex + 1)}
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg bg-muted/20">
                  {contentLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : viewing ? (
                    <div className="min-h-full flex flex-col">
                      <div className="flex-1 flex items-center justify-center p-4">
                        {viewing.contentType.startsWith("image/") ? (
                          <img
                            src={viewing.dataUrl}
                            alt={viewing.name}
                            className="max-h-[52vh] max-w-full object-contain rounded-lg border border-border"
                          />
                        ) : viewing.contentType === "application/pdf" ? (
                          <iframe
                            src={viewing.dataUrl}
                            title={viewing.name}
                            className="w-full h-[52vh] rounded-lg border border-border"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200/80 rounded-[16px] bg-slate-50/30 w-full">
                            <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">Preview not available for this file type</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3 border-t bg-background">
                        <p className="text-xs text-muted-foreground font-medium truncate">{viewing.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <a href={viewing.dataUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <ExternalLink className="w-4 h-4 mr-1" /> Open
                            </Button>
                          </a>
                          <a href={viewing.dataUrl} download={viewing.name}>
                            <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground">
                              <Download className="w-4 h-4 mr-1" /> Download
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      File content not available
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 flex justify-end pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
