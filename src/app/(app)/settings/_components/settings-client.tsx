"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { 
  Library, 
  Layers, 
  FileJson, 
  ShieldAlert 
} from "lucide-react";
import { 
  CategoryTab, 
  SeriesTab, 
  ImportExportTab, 
  BlacklistTab 
} from ".";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-6 duration-1000 animate-in fade-in slide-in-from-bottom-4">
        <TabsList className="no-scrollbar flex h-10 w-fit shrink-0 justify-start gap-1 rounded-xl border border-white/5 bg-white/3 p-1 backdrop-blur-xl">
          <TabsTrigger value="categories" className="flex h-full items-center gap-2 rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase transition-all duration-500 data-[state=active]:bg-white data-[state=active]:text-black">
            <Library className="h-3.5 w-3.5" />
            Kategoriler
          </TabsTrigger>
          <TabsTrigger value="series" className="flex h-full items-center gap-2 rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase transition-all duration-500 data-[state=active]:bg-white data-[state=active]:text-black">
            <Layers className="h-3.5 w-3.5" />
            Seriler
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex h-full items-center gap-2 rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase transition-all duration-500 data-[state=active]:bg-white data-[state=active]:text-black">
            <FileJson className="h-3.5 w-3.5" />
            Veri Akışları
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex h-full items-center gap-2 rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase transition-all duration-500 data-[state=active]:bg-white data-[state=active]:text-black">
            <ShieldAlert className="h-3.5 w-3.5" />
            AI Tercihleri
          </TabsTrigger>
        </TabsList>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/1 p-6 shadow-2xl md:p-8">
          {/* Subtle background glow for calmness */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />
          
          <div className="relative duration-700 animate-in fade-in zoom-in-95">
            {activeTab === "categories" && <CategoryTab />}
            {activeTab === "series" && <SeriesTab />}
            {activeTab === "import-export" && <ImportExportTab />}
            {activeTab === "blacklist" && <BlacklistTab />}
          </div>
        </div>
      </div>
    </Tabs>
  );
}
