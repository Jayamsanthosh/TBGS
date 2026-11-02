"use client";

import { useRef, useState } from "react";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_URL } from "@/lib/config";
import { createPurchaseRequestPdf, purchaseRequestPdfFileName } from "@/lib/purchaseRequestPdf";
import { useToast, DEFAULT_TOAST_DURATION } from "@/hooks/use-toast";

interface Option {
  value: string;
  label: string;
}

interface Props {
  refNo: string;
  record?: any;
  locationOptions?: Option[];
  className?: string;
  showLabels?: boolean;
}

export default function PurchaseRequestPdfActions({
  refNo,
  record,
  locationOptions,
  className,
  showLabels = false,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState("purchase-request.pdf");
  const docRef = useRef<any>(null);

  const loadPdf = async () => {
    const response = await fetch(`${API_URL}/purchase-request/hdr?refNo=${encodeURIComponent(refNo)}`);
    const headerJson = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(headerJson?.message || "Failed to load purchase request");

    const detailsResponse = await fetch(`${API_URL}/purchase-request/dtls?refNo=${encodeURIComponent(refNo)}`);
    const detailsJson = await detailsResponse.json().catch(() => ({}));
    if (!detailsResponse.ok) throw new Error(detailsJson?.message || "Failed to load purchase request lines");

    const rawHdr = headerJson?.data ?? {};
    const deliveryLocation = (locationOptions || []).find(
      (option) => option.value === String(rawHdr?.DELIVERY_LOCATION_ID ?? "")
    )?.label;
    const hdr = {
      ...rawHdr,
      ...(record || {}),
      DELIVERY_LOCATION_NAME: deliveryLocation || rawHdr?.DELIVERY_LOCATION_NAME || "",
    };
    const lines = Array.isArray(detailsJson?.data) ? detailsJson.data : [];
    const doc = await createPurchaseRequestPdf(hdr, lines);
    return { doc, fileName: purchaseRequestPdfFileName(hdr) };
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
        title: typeof e === "string" ? e : e?.message || "Failed to generate purchase request PDF",
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
        title: typeof e === "string" ? e : e?.message || "Failed to generate purchase request PDF",
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
          title="View purchase request PDF"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
          {showLabels && <span className="ml-1">View PDF</span>}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={download}
          disabled={!refNo || loading}
          title="Download purchase request PDF"
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
              Purchase Request PDF
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
