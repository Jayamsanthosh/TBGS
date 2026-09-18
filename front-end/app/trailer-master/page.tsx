"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TrailersTab from "./trailers-tab";
import DMSFilesTab from "@/app/truck-master/files-tab";
import { useLinkPagesId } from "@/hooks/useLinkPagesId";

export default function TrailerMasterPage() {
  const linkPagesId = useLinkPagesId(0);
  const [selectedTrailerNo, setSelectedTrailerNo] = useState<string>("");
  const [activeTab, setActiveTab] = useState("trailers");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="trailers">Trailer Master</TabsTrigger>
          <TabsTrigger value="files">
            Document Files
            {selectedTrailerNo && (
              <span className="ml-2 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {selectedTrailerNo}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="trailers">
          <TrailersTab
            onViewFiles={(trailerNo: string) => {
              setSelectedTrailerNo(trailerNo);
              setActiveTab("files");
            }}
          />
        </TabsContent>
        <TabsContent value="files">
          <DMSFilesTab
            linkPagesId={linkPagesId}
            pageRefNo={selectedTrailerNo}
            onClearFilter={() => setSelectedTrailerNo("")}
            entityLabel="Trailer"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}