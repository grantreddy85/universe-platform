import React, { useState, useRef, useCallback } from "react";
import { Plus, Trash2, ArrowRight, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

const NODE_TYPES = {
  input: { label: "Input", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", emoji: "📥" },
  process: { label: "Process", color: "#0ea5e9", bg: "#e0f2fe", border: "#bae6fd", emoji: "⚙️" },
  align: { label: "Alignment", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", emoji: "🧬" },
  qc: { label: "QC / Filter", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", emoji: "🔬" },
  variant_call: { label: "Variant Calling", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8", emoji: "🔍" },
  normalise: { label: "Normalisation", color: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4", emoji: "📊" },
  cluster: { label: "Clustering", color: "#f97316", bg: "#fff7ed", border: "#fed7aa", emoji: "🔵" },
  statistical: { label: "Statistical Analysis", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", emoji: "📈" },
  decision: { label: "Decision Gate", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "⬡" },
  output: { label: "Output", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", emoji: "📤" },
};

const PALETTE = Object.entries(NODE_TYPES);

function NodeCard({ node, selected, onSelect, onDelete, onStartEdge, onDrag, connecting }) {
  const type = NODE_TYPES[node.type] || NODE_TYPES.process;
  const handleMouseDown = (e) => {
    if (e.target.closest("[data-action]")) return;
    e.preventDefault();
    onDrag(node.id, e);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(node.id)}
      className="absolute select-none cursor-pointer"
      style={{ left: node.x, top: node.y, width: 170 }}
    >
      <div
        className="rounded-xl border-2 shadow-sm transition-all"
        style={{
          background: type.bg,
          borderColor: selected ? type.color : type.border,
          boxShadow: selected ? `0 0 0 3px ${type.color}33` : undefined,
        }}
      >
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base leading-none">{type.emoji}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: type.color }}>
              {type.label}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-800 leading-snug">{node.label}</p>
          {node.params && (
            <p className="text-[10px] text-gray-400 mt-1 leading-snug font-mono truncate">{node.params}</p>
          )}
        </div>
        {/* Connectors */}
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-white" title="In" />
          <button
            data-action="connect"
            onMouseDown={(e) => { e.stopPropagation(); onStartEdge(node.id, e); }}
            className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 transition-colors hover:scale-125"
            style={{ borderColor: type.color, background: connecting === node.id ? type.color : "white" }}
            title="Drag to connect"
          />
        </div>
        {/* Delete btn */}
        {selected && (
          <button
            data-action="delete"
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function EdgeLine({ from, to, nodes }) {
  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);
  if (!fromNode || !toNode) return null;
  const x1 = fromNode.x + 170;
  const y1 = fromNode.y + 36;
  const x2 = toNode.x;
  const y2 = toNode.y + 36;
  const cx = (x1 + x2) / 2;
  return (
    <path
      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
      stroke="#94a3b8"
      strokeWidth={2}
      fill="none"
      markerEnd="url(#arrow)"
      strokeDasharray="none"
    />
  );
}

export default function WorkflowCanvas({ nodes, edges, onChange }) {
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [tempEdge, setTempEdge] = useState(null);
  const canvasRef = useRef(null);
  const dragging = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const addNode = (type) => {
    const id = `node_${Date.now()}`;
    const canvas = canvasRef.current?.getBoundingClientRect();
    const newNode = {
      id,
      type,
      label: NODE_TYPES[type].label,
      params: "",
      x: 80 + Math.random() * 300,
      y: 80 + Math.random() * 200,
    };
    onChange({ nodes: [...nodes, newNode], edges });
  };

  const deleteNode = (id) => {
    onChange({
      nodes: nodes.filter(n => n.id !== id),
      edges: edges.filter(e => e.from !== id && e.to !== id),
    });
    setSelected(null);
  };

  const startDrag = useCallback((id, e) => {
    dragging.current = id;
    const node = nodes.find(n => n.id === id);
    offset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
    const onMove = (ev) => {
      if (!dragging.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      const x = Math.max(0, ev.clientX - offset.current.x);
      const y = Math.max(0, ev.clientY - offset.current.y);
      onChange(prev => ({
        nodes: prev.nodes.map(n => n.id === dragging.current ? { ...n, x, y } : n),
        edges: prev.edges,
      }));
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [nodes, onChange]);

  const startEdge = (fromId, e) => {
    e.stopPropagation();
    setConnecting(fromId);
    setTempEdge(null);
    const onMove = (ev) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      setTempEdge({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
    };
    const onUp = (ev) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const toId = el?.closest("[data-nodeid]")?.getAttribute("data-nodeid");
      if (toId && toId !== fromId) {
        const exists = edges.some(e => e.from === fromId && e.to === toId);
        if (!exists) onChange({ nodes, edges: [...edges, { id: `e_${Date.now()}`, from: fromId, to: toId }] });
      }
      setConnecting(null);
      setTempEdge(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const fromNode = connecting ? nodes.find(n => n.id === connecting) : null;

  return (
    <div className="flex h-full">
      {/* Palette */}
      <div className="w-44 flex-shrink-0 border-r border-gray-100 bg-white p-3 overflow-y-auto">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Node Types</p>
        <div className="space-y-1.5">
          {PALETTE.map(([key, def]) => (
            <button
              key={key}
              onClick={() => addNode(key)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all hover:scale-105"
              style={{ background: def.bg, borderColor: def.border }}
            >
              <span className="text-sm">{def.emoji}</span>
              <span className="text-[10px] font-medium" style={{ color: def.color }}>{def.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#f8fafc]"
        style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        onClick={() => setSelected(null)}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-sm text-gray-300 font-medium">Click a node type to add it to the canvas</p>
              <p className="text-xs text-gray-200 mt-1">Drag to move · Connect output → input to build pipeline</p>
            </div>
          </div>
        )}

        {/* SVG edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
          </defs>
          {edges.map(e => (
            <EdgeLine key={e.id} from={e.from} to={e.to} nodes={nodes} />
          ))}
          {connecting && fromNode && tempEdge && (
            <path
              d={`M ${fromNode.x + 170} ${fromNode.y + 36} L ${tempEdge.x} ${tempEdge.y}`}
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="none"
            />
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <div key={node.id} data-nodeid={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
            <NodeCard
              node={node}
              selected={selected === node.id}
              onSelect={setSelected}
              onDelete={deleteNode}
              onStartEdge={startEdge}
              onDrag={startDrag}
              connecting={connecting}
            />
          </div>
        ))}
      </div>

      {/* Properties panel */}
      {selected && (() => {
        const node = nodes.find(n => n.id === selected);
        if (!node) return null;
        const type = NODE_TYPES[node.type] || NODE_TYPES.process;
        return (
          <div className="w-52 flex-shrink-0 border-l border-gray-100 bg-white p-4">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Node Properties</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 font-medium block mb-1">Label</label>
                <input
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-300"
                  value={node.label}
                  onChange={e => onChange({ nodes: nodes.map(n => n.id === selected ? { ...n, label: e.target.value } : n), edges })}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium block mb-1">Parameters / Command</label>
                <textarea
                  className="w-full text-[10px] font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-300 h-24 resize-none"
                  placeholder="e.g. --threads 4 --min-mapq 30"
                  value={node.params || ""}
                  onChange={e => onChange({ nodes: nodes.map(n => n.id === selected ? { ...n, params: e.target.value } : n), edges })}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium block mb-1">Type</label>
                <p className="text-xs font-medium" style={{ color: type.color }}>{type.emoji} {type.label}</p>
              </div>
              <button
                onClick={() => deleteNode(selected)}
                className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" /> Delete Node
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}