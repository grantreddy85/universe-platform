import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const CLUSTER_COLORS = ["bg-blue-400", "bg-teal-400", "bg-violet-400", "bg-amber-400", "bg-orange-400", "bg-pink-400", "bg-indigo-400"];
const BADGE_COLORS = ["bg-blue-50 text-blue-700", "bg-teal-50 text-teal-700", "bg-violet-50 text-violet-700", "bg-amber-50 text-amber-700", "bg-orange-50 text-orange-700", "bg-pink-50 text-pink-700", "bg-indigo-50 text-indigo-700"];

export default function TopicClustersEditor({ topicClusters = [], onChange }) {
  const [clusters, setClusters] = useState(
    topicClusters.length > 0 ? topicClusters : [{ topic: "", weight_percentage: 100 }]
  );

  const total = clusters.reduce((s, c) => s + (Number(c.weight_percentage) || 0), 0);
  const isValid = Math.round(total) === 100;

  useEffect(() => {
    onChange(clusters);
  }, [clusters]);

  const update = (index, field, value) => {
    setClusters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const add = () => {
    const remaining = Math.max(0, 100 - total);
    setClusters((prev) => [...prev, { topic: "", weight_percentage: remaining }]);
  };

  const remove = (index) => {
    setClusters((prev) => prev.filter((_, i) => i !== index));
  };

  const autoBalance = () => {
    const per = Math.floor(100 / clusters.length);
    const remainder = 100 - per * clusters.length;
    setClusters((prev) => prev.map((c, i) => ({ ...c, weight_percentage: per + (i === 0 ? remainder : 0) })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Topic Clusters</Label>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${isValid ? "text-emerald-600" : "text-red-500"}`}>
            {total.toFixed(1)}% / 100%
          </span>
          {!isValid && (
            <button onClick={autoBalance} className="text-[11px] text-blue-500 hover:underline">
              Auto-balance
            </button>
          )}
        </div>
      </div>

      {!isValid && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-600">Topic weights must total exactly 100%.</p>
        </div>
      )}

      <div className="space-y-2">
        {clusters.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="e.g. Oncology, CRISPR, Neurobiology"
              value={c.topic}
              onChange={(e) => update(i, "topic", e.target.value)}
              className="text-xs flex-1 h-8"
            />
            <div className="flex items-center gap-1 w-20">
              <Input
                type="number"
                min={0}
                max={100}
                value={c.weight_percentage}
                onChange={(e) => update(i, "weight_percentage", Number(e.target.value))}
                className="text-xs h-8 w-14 text-center"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <button
              onClick={() => remove(i)}
              className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button variant="ghost" size="sm" onClick={add} className="text-xs text-gray-500 h-7 px-2">
        <Plus className="w-3 h-3 mr-1" />
        Add Topic
      </Button>

      {isValid && clusters.filter(c => c.topic).length > 0 && (
        <div className="mt-2">
          <div className="flex rounded-full overflow-hidden h-2">
            {clusters.filter(c => c.topic).map((c, i) => (
              <div key={i} className={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} style={{ width: `${c.weight_percentage}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {clusters.filter(c => c.topic).map((c, i) => (
              <Badge key={i} variant="secondary" className={`text-[10px] ${BADGE_COLORS[i % BADGE_COLORS.length]}`}>
                {c.topic}: {c.weight_percentage}%
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}