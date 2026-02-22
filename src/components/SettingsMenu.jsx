import React, { useEffect } from "react";
import { X, Settings } from "lucide-react";
import { useTheme } from "../Layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsMenu({ open, onClose }) {
  const { theme, updateTheme } = useTheme();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Theme Settings</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Typography Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Typography</h3>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Font Family</Label>
              <Select value={theme.fontFamily} onValueChange={(value) => updateTheme({ fontFamily: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funnel Sans">Funnel Sans</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Font Scale: {theme.fontScale.toFixed(2)}</Label>
              <Slider
                value={[theme.fontScale]}
                onValueChange={(values) => updateTheme({ fontScale: values[0] })}
                min={0.8}
                max={1.4}
                step={0.05}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Colors</h3>
            
            <div className="space-y-3">
              <ColorPicker
                label="Primary Color"
                value={theme.primaryColor}
                onChange={(value) => updateTheme({ primaryColor: value })}
              />
              <ColorPicker
                label="Secondary Color"
                value={theme.secondaryColor}
                onChange={(value) => updateTheme({ secondaryColor: value })}
              />
              <ColorPicker
                label="Accent Color"
                value={theme.accentColor}
                onChange={(value) => updateTheme({ accentColor: value })}
              />
              <ColorPicker
                label="Neutral Color"
                value={theme.neutralColor}
                onChange={(value) => updateTheme({ neutralColor: value })}
              />
            </div>
          </div>

          {/* Theme Mode Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Appearance</h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-gray-900">Dark Mode</Label>
                <p className="text-xs text-gray-500 mt-0.5">Switch to dark theme</p>
              </div>
              <Switch
                checked={theme.themeMode === "dark"}
                onCheckedChange={(checked) => updateTheme({ themeMode: checked ? "dark" : "light" })}
              />
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              updateTheme({
                fontFamily: 'Funnel Sans',
                primaryColor: '#1a1a1a',
                secondaryColor: '#ff6b35',
                accentColor: '#00d4aa',
                neutralColor: '#f8f9fa',
                fontScale: 1.0,
                themeMode: 'light'
              });
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 rounded"
        />
      </div>
    </div>
  );
}