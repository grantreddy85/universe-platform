import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Microscope, Dna, Atom, TestTubes, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LabServiceCard from "@/components/labs/LabServiceCard";
import LabRequestDialog from "@/components/labs/LabRequestDialog";

const CATEGORY_META = {
  biological_cellular: {
    label: "Biological & Cellular Systems",
    icon: Microscope,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    dot: "bg-emerald-400"
  },
  molecular_analytical: {
    label: "Molecular & Analytical Systems",
    icon: Dna,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    dot: "bg-blue-400"
  },
  protein_immunology: {
    label: "Protein & Immunology Systems",
    icon: Atom,
    color: "bg-purple-50 text-purple-600 border-purple-100",
    dot: "bg-purple-400"
  },
  structural_chemical: {
    label: "Structural Chemical Synthesis & Systems",
    icon: TestTubes,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    dot: "bg-amber-400"
  }
};

const CATEGORIES = Object.keys(CATEGORY_META);

export default function Labs() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedService, setSelectedService] = useState(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["lab_services"],
    queryFn: () => base44.entities.LabService.list()
  });

  const filtered = services.filter((s) => {
    const matchesSearch =
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
    activeCategory === "all" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter((s) => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            


            <h1 className="text-xl font-semibold text-gray-900">UniVerse Labs</h1>
          </div>
          <p className="text-gray-400 text-sm">Browse available lab equipment and submit service requests to have your samples or data analysed.

          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search services or equipment..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />

          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              activeCategory === "all" ?
              "bg-gray-900 text-white border-gray-900" :
              "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`
              }>

              All
            </button>
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  activeCategory === cat ?
                  "bg-gray-900 text-white border-gray-900" :
                  "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`
                  }>

                  <Icon className="w-3.5 h-3.5" />
                  {meta.label.split(" ")[0]}
                </button>);

            })}
          </div>
        </div>

        {/* Loading */}
        {isLoading &&
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            Loading services...
          </div>
        }

        {/* Empty state */}
        {!isLoading && filtered.length === 0 &&
        <div className="text-center py-24 text-gray-400 text-sm">
            No services found.
          </div>
        }

        {/* Grouped Service Cards */}
        {!isLoading &&
        Object.entries(grouped).map(([cat, items]) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <div key={cat} className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${meta.color}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">{meta.label}</h2>
                  <span className="text-xs text-gray-400 ml-1">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map((service) =>
                <LabServiceCard
                  key={service.id}
                  service={service}
                  categoryMeta={meta}
                  onRequest={() => setSelectedService(service)} />

                )}
                </div>
              </div>);

        })}
      </div>

      {/* Request Dialog */}
      {selectedService &&
      <LabRequestDialog
        service={selectedService}
        open={!!selectedService}
        onClose={() => setSelectedService(null)} />

      }
    </div>);

}