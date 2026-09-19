"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TrucksTab from "./trucks-tab";
import DMSFilesTab from "./files-tab";
import { useLinkPagesId } from "@/hooks/useLinkPagesId";

export default function TruckMasterPage() {
  const linkPagesId = useLinkPagesId(0);
  const [selectedTruckNo, setSelectedTruckNo] = useState<string>("");
  const [activeTab, setActiveTab] = useState("trucks");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="trucks">Truck Master</TabsTrigger>
          <TabsTrigger value="files">
            Document Files
            {selectedTruckNo && (
              <span className="ml-2 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {selectedTruckNo}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="trucks">
          <TrucksTab
            linkPagesId={linkPagesId}
            onViewFiles={(truckNo: string) => {
              setSelectedTruckNo(truckNo);
              setActiveTab("files");
            }}
          />
        </TabsContent>
        <TabsContent value="files">
          <DMSFilesTab
            linkPagesId={linkPagesId}
            pageRefNo={selectedTruckNo}
            onClearFilter={() => setSelectedTruckNo("")}
            entityLabel="Truck"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
