"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { 
  Library, 
  Tag, 
  Layers, 
  FileJson, 
  ShieldAlert 
} from "lucide-react";
import { 
  CategoryTab, 
  TagTab, 
  SeriesTab, 
  ImportExportTab, 
  BlacklistTab 
} from ".";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-6">
        <TabsList className="flex w-full justify-start gap-2 overflow-x-auto no-scrollbar rounded-[22px] p-1.5">
          <TabsTrigger value="categories" className="flex items-center gap-2 shrink-0">
            <Library className="w-4 h-4" />
            Kategoriler
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2 shrink-0">
            <Tag className="w-4 h-4" />
            Etiketler
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4" />
            Seriler
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2 shrink-0">
            <FileJson className="w-4 h-4" />
            İçe/Dışa Aktar
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4" />
            AI Kara Liste
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[400px] rounded-[28px] border border-border/55 bg-surface p-5 md:p-6">
          {activeTab === "categories" && <CategoryTab />}
          {activeTab === "tags" && <TagTab />}
          {activeTab === "series" && <SeriesTab />}
          {activeTab === "import-export" && <ImportExportTab />}
          {activeTab === "blacklist" && <BlacklistTab />}
        </div>
      </div>
    </Tabs>
  );
}
