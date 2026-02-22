import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload } from "lucide-react";

export default function UniVerseLogo({ className = "w-8 h-8", allowUpload = false }) {
  const [customLogoUrl, setCustomLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user.custom_logo_url) {
          setCustomLogoUrl(user.custom_logo_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ custom_logo_url: file_url });
      setCustomLogoUrl(file_url);
    } catch (error) {
      console.error("Failed to upload logo:", error);
    } finally {
      setUploading(false);
    }
  };

  if (customLogoUrl) {
    return (
      <div className="relative group">
        <img src={customLogoUrl} alt="Logo" className={className} />
        {allowUpload && (
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded">
            <Upload className="w-4 h-4 text-white" />
            <input
              type="file"
              accept="image/svg+xml,image/png,image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0099CC" />
          </linearGradient>
        </defs>
        {/* Left arrow */}
        <path
          d="M10 50 L35 25 L35 40 L25 50 L35 60 L35 75 Z"
          fill="url(#logoGradient)"
        />
        {/* Right arrow */}
        <path
          d="M45 20 L70 45 L55 45 L55 80 L45 80 Z"
          fill="url(#logoGradient)"
          opacity="0.85"
        />
        <path
          d="M55 45 L80 70 L65 70 L55 60 Z"
          fill="url(#logoGradient)"
        />
      </svg>
      {allowUpload && (
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded">
          <Upload className="w-4 h-4 text-white" />
          <input
            type="file"
            accept="image/svg+xml,image/png,image/jpeg"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}