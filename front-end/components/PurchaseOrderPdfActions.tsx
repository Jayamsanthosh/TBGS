"use client";

import { useRef, useState } from "react";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_URL } from "@/lib/config";
import { createPurchaseOrderPdf, purchaseOrderPdfFileName } from "@/lib/purchaseOrderPdf";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";

interface Props {
  refNo: string;
  className?: string;
  showLabels?: boolean;
}

export default function PurchaseOrderPdfActions({ refNo, className, showLabels = false }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState("purchase-order.pdf");
  const docRef = useRef<any>(null);

  const loadPdf = async () => {
    const response = await fetch(`${API_URL}/purchase-order/hdr?refNo=${encodeURIComponent(refNo)}`);
    const headerJson = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(headerJson?.message || "Failed to load purchase order");
    const detailsResponse = await fetch(`${API_URL}/purchase-order/dtls?refNo=${encodeURIComponent(refNo)}`);
    const detailsJson = await detailsResponse.json().catch(() => ({}));
    if (!detailsResponse.ok) throw new Error(detailsJson?.message || "Failed to load purchase order lines");
    const hdr = headerJson?.data;
    const lines = Array.isArray(detailsJson?.data) ? detailsJson.data : [];
    const doc = await createPurchaseOrderPdf(hdr, lines);
    return { doc, fileName: purchaseOrderPdfFileName(hdr) };
  };

  const close = () => {
    setOpen(false);
    setUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    docRef.current = null;
  };

  const view = async () => {
    if (!refNo || loading) return;
    setLoading(true);
    try {
      const { doc, fileName } = await loadPdf();
      const nextUrl = URL.createObjectURL(doc.output("blob") as Blob);
      setUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      docRef.current = doc;
      setName(fileName);
      setOpen(true);
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to generate purchase order PDF",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!refNo || loading) return;
    setLoading(true);
    try {
      const { doc, fileName } = await loadPdf();
      doc.save(fileName);
    } catch (e: any) {
      toast({
        title: typeof e === "string" ? e : e?.message || "Failed to generate purchase order PDF",
        variant: "destructive",
        duration: DEFAULT_TOAST_DURATION,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-1 ${className ?? ""}`}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={view}
          disabled={!refNo || loading}
          title="View purchase order PDF"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
          {showLabels && <span className="ml-1">View PO PDF</span>}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={download}
          disabled={!refNo || loading}
          title="Download purchase order PDF"
        >
          <Download className="w-3.5 h-3.5" />
          {showLabels && <span className="ml-1">Download</span>}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}>
        <DialogContent className="max-w-5xl h-[92vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Purchase Order PDF
              <span className="text-xs font-normal text-muted-foreground">{name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border bg-muted/20 overflow-hidden">
            {url ? (
              <iframe src={url} title={name} className="w-full h-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Generating PDF...
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={close}>Close</Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => docRef.current?.save(name)}
              disabled={!url}
            >
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
