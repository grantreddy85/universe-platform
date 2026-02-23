import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function UniVerseLogo({ className = "w-8 h-8" }) {
  const [customLogoUrl, setCustomLogoUrl] = useState(null);

  useEffect(() => {
    base44.auth.me().
    then((user) => {
      if (user.custom_logo_url) {
        setCustomLogoUrl(user.custom_logo_url);
      }
    }).
    catch(() => {});
  }, []);

  if (customLogoUrl) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}>

      {/* Left chevron - pointing left */}
      <path
        d="M 35 10 L 15 30 L 35 50"
        stroke="#3B82F6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" />

      {/* Right chevron - pointing right */}
      <path
        d="M 25 10 L 45 30 L 25 50"
        stroke="#3B82F6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" />

    </svg>);

}