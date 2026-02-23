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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}>

      {/* Left chevron */}
      <path
        d="M 20 35 L 40 50 L 20 65"
        fill="#1E3A8A"
        stroke="none" />

      {/* Right chevron */}
      <path
        d="M 45 35 L 65 50 L 45 65"
        fill="#3B82F6"
        stroke="none" />

    </svg>);

}