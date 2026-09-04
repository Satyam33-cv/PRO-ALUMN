"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface GeoCluster {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  alumni: Array<{
    id: string;
    name: string;
    currentCompany?: string;
    jobTitle?: string;
    avatarUrl?: string;
  }>;
}

interface DirectoryMapProps {
  clusters: GeoCluster[];
  onSelectCity?: (city: string) => void;
}

export default function DirectoryMap({ clusters, onSelectCity }: DirectoryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to prevent SSR issues
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if already initialized
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered around India / Global view
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        scrollWheelZoom: false,
      });
      mapInstanceRef.current = map;

      // 100% Free OpenStreetMap CartoDB / OSM tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add custom HTML Markers for each cluster
      clusters.forEach((cluster) => {
        if (typeof cluster.lat !== "number" || typeof cluster.lng !== "number") return;

        const isDomestic = cluster.country === "India";
        const badgeColor = isDomestic ? "#2563EB" : "#FF6B00";

        const iconHtml = `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ffffff;
            border: 2px solid #000000;
            box-shadow: 3px 3px 0px #000000;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${badgeColor};"></span>
            <span>${cluster.city}</span>
            <span style="background:#000000; color:#ffffff; padding: 1px 4px; border-radius: 2px; font-size: 10px;">${cluster.count}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "leaflet-neo-marker",
          iconSize: [120, 30],
          iconAnchor: [60, 15],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: customIcon }).addTo(map);

        const alumniListHtml = cluster.alumni
          .map(
            (a) => `
            <div style="font-size: 11px; margin-top: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
              <strong>${a.name}</strong>
              ${a.currentCompany ? `<span style="color: #64748b;"> • ${a.currentCompany}</span>` : ""}
            </div>`
          )
          .join("");

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 4px;">
            <div style="font-size: 14px; font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 4px;">
              📍 ${cluster.city}, ${cluster.country}
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #2563EB; margin: 4px 0;">
              ${cluster.count} Verified Alumni
            </div>
            <div style="max-height: 120px; overflow-y: auto; margin-bottom: 8px;">
              ${alumniListHtml}
            </div>
            <button id="btn-filter-${cluster.city.replace(/\s+/g, "_")}" style="
              width: 100%;
              background: #000000;
              color: #ffffff;
              border: none;
              font-size: 11px;
              font-weight: 700;
              padding: 4px 8px;
              cursor: pointer;
              text-transform: uppercase;
            ">
              Filter Directory by ${cluster.city}
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on("popupopen", () => {
          const btn = document.getElementById(`btn-filter-${cluster.city.replace(/\s+/g, "_")}`);
          if (btn && onSelectCity) {
            btn.onclick = () => {
              onSelectCity(cluster.city);
              map.closePopup();
            };
          }
        });
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clusters, onSelectCity]);

  return (
    <div className="relative w-full overflow-hidden border-2 border-black bg-slate-100 shadow-[4px_4px_0px_#000]">
      <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 border border-black bg-blue-600"></span>
          <span>OpenStreetMap Global Alumni Clusters</span>
        </div>
        <div className="font-mono text-slate-600">100% Free • No Tile API Keys Required</div>
      </div>
      <div ref={mapContainerRef} className="h-[460px] w-full" style={{ zIndex: 1 }} />
    </div>
  );
}
