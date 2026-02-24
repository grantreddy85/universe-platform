import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ROLE_COLORS = {
  researcher: "bg-blue-50 text-blue-700",
  lab: "bg-teal-50 text-teal-700",
  universe: "bg-violet-50 text-violet-700",
  investor: "bg-amber-50 text-amber-700",
  funder: "bg-orange-50 text-orange-700",
  tool_creator: "bg-gray-100 text-gray-700",
};

const ROLES = ["researcher", "lab", "universe", "investor", "funder", "tool_creator"];

export default function AttributionEditor({ attribution = [], onChange }) {
  const [rows, setRows] = useState(
    attribution.length > 0
      ? attribution
      : [
          { contributor: "", role: "researcher", share_percentage: 40 },
          { contributor: "UniVerse Platform", role: "universe", share_percentage: 20 },
        ]
  );

  const total = rows.reduce((s, r) => s + (Number(r.share_percentage) || 0), 0);
  const isValid = Math.round(total) === 100;

  useEffect(() => {
    onChange(rows);
  }, [rows]);

  const update = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const add = () => {
    const remaining = Math.max(0, 100 - total);
    setRows((prev) => [...prev, { contributor: "", role: "researcher", share_percentage: remaining }]);
  };

  const remove = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Distribute remaining share equally when percentages don't add up
  const autoBalance = () => {
    const perRow = Math.floor(100 / rows.length);
    const remainder = 100 - perRow * rows.length;
    setRows((prev) =>
      prev.map((r, i) => ({ ...r, share_percentage: perRow + (i === 0 ? remainder : 0) }))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attribution Breakdown</Label>
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
          <p className="text-xs text-red-600">Attribution must total exactly 100%.</p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Contributor name or email"
              value={row.contributor}
              onChange={(e) => update(i, "contributor", e.target.value)}
              className="text-xs flex-1 h-8"
            />
            <select
              value={row.role}
              onChange={(e) => update(i, "role", e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white text-gray-700 h-8 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 w-20">
              <Input
                type="number"
                min={0}
                max={100}
                value={row.share_percentage}
                onChange={(e) => update(i, "share_percentage", Number(e.target.value))}
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
        Add Contributor
      </Button>

      {/* Visual breakdown */}
      {isValid && rows.length > 0 && (
        <div className="mt-3">
          <div className="flex rounded-full overflow-hidden h-2">
            {rows.map((r, i) => {
              const colors = ["bg-blue-400", "bg-teal-400", "bg-violet-400", "bg-amber-400", "bg-orange-400", "bg-gray-400"];
              return (
                <div
                  key={i}
                  className={colors[i % colors.length]}
                  style={{ width: `${r.share_percentage}%` }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {rows.map((r, i) => (
              <Badge key={i} variant="secondary" className={`text-[10px] ${ROLE_COLORS[r.role] || "bg-gray-100"}`}>
                {r.contributor || "TBD"} · {r.share_percentage}%
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}