"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DriversTab from "./drivers-tab";
import DMSFilesTab from "@/app/truck-master/files-tab";
import { useLinkPagesId } from "@/hooks/useLinkPagesId";

export default function DriverMasterPage() {
  const linkPagesId = useLinkPagesId(0);
  const [selectedDriverEmpId, setSelectedDriverEmpId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("drivers");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="drivers">Driver Master</TabsTrigger>
          <TabsTrigger value="files">
            Document Files
            {selectedDriverEmpId && (
              <span className="ml-2 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {selectedDriverEmpId}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="drivers">
          <DriversTab
            linkPagesId={linkPagesId}
            onViewFiles={(driverEmpId: string) => {
              setSelectedDriverEmpId(driverEmpId);
              setActiveTab("files");
            }}
          />
        </TabsContent>
        <TabsContent value="files">
          <DMSFilesTab
            linkPagesId={linkPagesId}
            pageRefNo={selectedDriverEmpId}
            onClearFilter={() => setSelectedDriverEmpId("")}
            entityLabel="Driver"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
