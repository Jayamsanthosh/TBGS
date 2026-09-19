"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SettingsTab from "./settings-tab";
import FilesTab from "./files-tab";

export default function BpProductVatPercentageSettingsPage() {
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedSettingId, setSelectedSettingId] = useState<string>("");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="files">
            Files
            {selectedSettingId && (
              <span className="ml-2 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                #{selectedSettingId}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <SettingsTab
            onViewFiles={(settingId: string) => {
              setSelectedSettingId(settingId);
              setActiveTab("files");
            }}
          />
        </TabsContent>
        <TabsContent value="files">
          <FilesTab
            initialSettingId={selectedSettingId}
            onClearSetting={() => setSelectedSettingId("")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}