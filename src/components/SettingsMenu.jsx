import React, { useState } from "react";
import { useTheme } from "@/Layout";
import { X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, updateTheme } = useTheme();

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen]);

  return (
    <>
      {/* Gear Icon Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Theme Settings"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {/* Overlay + Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-end"
          onClick={handleClose}
        >
          <div
            className="w-[400px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Theme Settings</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Typography Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Typography
                </h3>

                {/* Font Family */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Font Family</Label>
                  <Select
                    value={theme.fontFamily}
                    onValueChange={(value) => updateTheme({ fontFamily: value })}
                  >
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

                {/* Font Scale */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm text-gray-600">Font Scale</Label>
                    <span className="text-sm text-gray-500">{theme.fontScale.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[theme.fontScale]}
                    onValueChange={([value]) => updateTheme({ fontScale: value })}
                    min={0.8}
                    max={1.4}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Colors Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Colors
                </h3>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => updateTheme({ accentColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.accentColor}
                      onChange={(e) => updateTheme({ accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded"
                    />
                  </div>
                </div>

                {/* Neutral Color */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Neutral Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={theme.neutralColor}
                      onChange={(e) => updateTheme({ neutralColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.neutralColor}
                      onChange={(e) => updateTheme({ neutralColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Mode Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Appearance
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-gray-600">Dark Mode</Label>
                    <p className="text-xs text-gray-400">Toggle light/dark theme</p>
                  </div>
                  <Switch
                    checked={theme.themeMode === 'dark'}
                    onCheckedChange={(checked) => updateTheme({ themeMode: checked ? 'dark' : 'light' })}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
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
        </div>
      )}
    </>
  );
}