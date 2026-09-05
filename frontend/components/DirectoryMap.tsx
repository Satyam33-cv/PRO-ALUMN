"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export interface GeoCluster {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  alumni?: Array<{
    id: string;
    name: string;
    currentCompany?: string;
    jobTitle?: string;
    avatarUrl?: string;
  }>;
}

export interface HubPreset {
  id: string;
  name: string;
  count: number;
  coords: [number, number];
  zoom: number;
  color: string;
  textColor?: string;
  fellows: string;
}

export const CANONICAL_HUBS: HubPreset[] = [
  {
    id: "BLR",
    name: "Bengaluru, India",
    count: 142,
    coords: [12.9716, 77.5946],
    zoom: 11,
    color: "#CCFF00",
    fellows: "Vikram Aditya (Google Cloud), Rohit Nair (PhonePe), Priya Sen (InMobi)",
  },
  {
    id: "SF",
    name: "San Francisco / Silicon Valley",
    count: 88,
    coords: [37.7749, -122.4194],
    zoom: 11,
    color: "#FF5500",
    textColor: "#FFFFFF",
    fellows: "Sarah Jenkins (Snowflake), David Chen (Neuromorphic Labs), Elena Rostova (Stanford)",
  },
  {
    id: "NYC",
    name: "New York, USA",
    count: 64,
    coords: [40.7128, -74.006],
    zoom: 11,
    color: "#2E5BFF",
    textColor: "#FFFFFF",
    fellows: "Ananya Deshmukh (AWS), Marcus Vance (Datadog), Zoe Miller (Jane Street)",
  },
  {
    id: "SEA",
    name: "Seattle, USA",
    count: 42,
    coords: [47.6062, -122.3321],
    zoom: 11,
    color: "#000000",
    textColor: "#FFFFFF",
    fellows: "Prateek Shah (Stripe), Kevin Zhang (Amazon AWS), Maya Lin (Microsoft Azure)",
  },
  {
    id: "LDN",
    name: "London, UK",
    count: 35,
    coords: [51.5074, -0.1278],
    zoom: 11,
    color: "#FF5500",
    textColor: "#FFFFFF",
    fellows: "Arthur Pendelton (DeepMind), Siobhan Clarke (Monzo), Alex Wong (Revolut)",
  },
  {
    id: "TKO",
    name: "Tokyo, Japan",
    count: 18,
    coords: [35.6762, 139.6503],
    zoom: 11,
    color: "#CCFF00",
    fellows: "Kenji Sato (Preferred Networks), Yuka Takahashi (Sony AI)",
  },
];

interface DirectoryMapProps {
  clusters?: GeoCluster[];
  activeClusterId?: string;
  onSelectHub?: (hub: HubPreset) => void;
  onSelectCity?: (city: string) => void;
}

export default function DirectoryMap({
  clusters = [],
  activeClusterId,
  onSelectHub,
  onSelectCity,
}: DirectoryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedHubId, setSelectedHubId] = useState<string>(activeClusterId || "GLOBAL");

  // Fly to cluster
  const flyToCoords = (coords: [number, number], zoom: number, hubId: string, hubPreset?: HubPreset) => {
    setSelectedHubId(hubId);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, { duration: 1.2 });
    }
    if (hubPreset && onSelectHub) {
      onSelectHub(hubPreset);
    }
  };

  // Reset to global bounds
  const resetBounds = () => {
    setSelectedHubId("GLOBAL");
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.0, 15.0], 2, { duration: 1.0 });
    }
    if (onSelectHub) {
      onSelectHub({
        id: "GLOBAL",
        name: "Global Pool (142 Hubs)",
        count: 1248,
        coords: [22.0, 15.0],
        zoom: 2,
        color: "#CCFF00",
        fellows: "All global accredited nodes and verified engineering labs",
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        minZoom: 2,
        maxZoom: 16,
        scrollWheelZoom: false,
      }).setView([22.0, 15.0], 2);

      mapInstanceRef.current = map;

      // CartoDB Voyager / Positron or OSM clean light tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Render canonical hubs
      CANONICAL_HUBS.forEach((hub) => {
        const customIcon = L.divIcon({
          className: "custom-cluster-marker",
          html: `<div style="
            background-color: ${hub.color};
            color: ${hub.textColor || "#000000"};
            border: 2px solid #000000;
            box-shadow: 3px 3px 0px #000000;
            padding: 3px 6px;
            font-family: 'Space Mono', monospace;
            font-weight: 700;
            font-size: 11px;
            white-space: nowrap;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="width: 6px; height: 6px; background: #000000; display: inline-block;"></span>
            ${hub.id} [${hub.count}]
          </div>`,
          iconSize: [84, 28],
          iconAnchor: [42, 14],
        });

        const popupContent = `
          <div style="font-family: 'Space Grotesk', sans-serif; min-width: 210px; padding: 4px;">
            <div style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span>HUB // ${hub.id}</span>
              <span style="background: #CCFF00; padding: 1px 4px; border: 1px solid #000; color: #000;">${hub.count} FELLOWS</span>
            </div>
            <div style="font-weight: 700; font-size: 13px; text-transform: uppercase; margin-bottom: 2px; color: #000;">
              ${hub.name}
            </div>
            <div style="font-size: 11px; color: #444; margin-bottom: 8px; line-height: 1.3;">
              Prominent fellows: ${hub.fellows}
            </div>
            <button id="btn-explore-${hub.id}" style="
              width: 100%;
              display: block;
              text-align: center;
              background: #FF5500;
              color: #ffffff;
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              font-weight: 700;
              padding: 6px 8px;
              border: 2px solid #000000;
              box-shadow: 2px 2px 0px #000000;
              cursor: pointer;
              text-transform: uppercase;
            ">
              EXPLORE ${hub.count} DOSSIERS →
            </button>
          </div>
        `;

        const marker = L.marker(hub.coords, { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { closeButton: false });

        marker.on("click", () => {
          setSelectedHubId(hub.id);
          if (onSelectHub) {
            onSelectHub(hub);
          }
        });

        marker.on("popupopen", () => {
          const btn = document.getElementById(`btn-explore-${hub.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onSelectCity) {
                onSelectCity(hub.name.split(",")[0]);
              }
              if (onSelectHub) {
                onSelectHub(hub);
              }
              map.closePopup();
            };
          }
        });
      });

      // Also render any backend-supplied clusters if provided
      if (clusters && clusters.length > 0) {
        clusters.forEach((c) => {
          // Check if not already in canonical hubs
          const exists = CANONICAL_HUBS.some(
            (h) => Math.abs(h.coords[0] - c.lat) < 0.2 && Math.abs(h.coords[1] - c.lng) < 0.2
          );
          if (exists) return;

          const customIcon = L.divIcon({
            className: "custom-cluster-marker",
            html: `<div style="
              background-color: #ffffff;
              color: #000000;
              border: 2px solid #000000;
              box-shadow: 3px 3px 0px #000000;
              padding: 3px 6px;
              font-family: 'Space Mono', monospace;
              font-weight: 700;
              font-size: 11px;
              white-space: nowrap;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="width: 6px; height: 6px; background: #2E5BFF; display: inline-block;"></span>
              ${c.city.slice(0, 3).toUpperCase()} [${c.count}]
            </div>`,
            iconSize: [84, 28],
            iconAnchor: [42, 14],
          });

          const marker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(map);
          marker.on("click", () => {
            if (onSelectCity) onSelectCity(c.city);
          });
        });
      }

      // Ensure proper sizing after mount
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clusters, onSelectCity, onSelectHub]);

  return (
    <div className="border-2 border-black bg-surface relative shadow-[5px_5px_0px_#000000] overflow-hidden">
      {/* Topology Layer Header */}
      <div className="p-3 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <span className="bg-black text-white px-2 py-0.5 font-bold tracking-wider text-[10px]">
            TOPOLOGY LAYER 02 // GEO-SPATIAL
          </span>
          <span className="hidden sm:inline text-neutral-600 text-[11px]">
            EPSG:3857 // SPATIAL INDEX ACTIVE
          </span>
          <span className="inline-flex items-center px-2 py-0.5 bg-[#CCFF00] text-black border border-black text-[10px] font-bold">
            <span className="w-1.5 h-1.5 bg-black mr-1 animate-pulse inline-block"></span>
            142 GLOBAL NODES CONNECTED
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={resetBounds}
            className="px-2.5 py-1 bg-white border border-black text-[11px] font-bold hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            [ RESET BOUNDS ]
          </button>
          <span className="text-[10px] text-neutral-500 hidden md:inline">
            HNSW LATENCY: 1.8MS
          </span>
        </div>
      </div>

      {/* Rapid Cluster Jump Bar */}
      <div className="p-2.5 bg-surface border-b border-black flex flex-wrap items-center gap-1.5 font-mono text-xs">
        <span className="text-neutral-500 font-bold uppercase text-[10px] mr-1">
          RAPID CLUSTER JUMP:
        </span>
        <button
          type="button"
          onClick={resetBounds}
          className={`px-2 py-0.5 border border-black text-[11px] font-bold transition-colors ${
            selectedHubId === "GLOBAL"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-[#CCFF00]"
          }`}
        >
          GLOBAL (1,248)
        </button>
        {CANONICAL_HUBS.map((hub) => {
          const isActive = selectedHubId === hub.id;
          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => flyToCoords(hub.coords, hub.zoom, hub.id, hub)}
              className={`px-2 py-0.5 border border-black text-[11px] font-bold transition-colors ${
                isActive
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-[#CCFF00]"
              }`}
            >
              {hub.name.split(",")[0].split("/")[0].trim()} [{hub.count}]
            </button>
          );
        })}
      </div>

      {/* Interactive Map Viewport */}
      <div className="relative w-full h-[520px] bg-[#f7f4ee]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Spatial Cluster Telemetry Overlay Card */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto max-w-sm hidden sm:block">
          <div className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] font-mono text-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-black pb-1">
              <span className="font-bold text-black">// SPATIAL CLUSTER TELEMETRY</span>
              <span className="w-2 h-2 bg-emerald-500 inline-block"></span>
            </div>
            <div className="text-[11px] text-neutral-700">
              Click any cluster node to inspect fellows or filter candidate dossiers in real-time.
            </div>
            <div className="flex items-center space-x-2 text-[10px] pt-1 text-neutral-500">
              <span>PROJECTION: MERCATOR</span>
              <span>•</span>
              <span>TILES: CARTODB POSITRON</span>
            </div>
          </div>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col space-y-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 bg-white border-2 border-black font-mono font-bold text-lg flex items-center justify-center hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 bg-white border-2 border-black font-mono font-bold text-lg flex items-center justify-center hover:bg-neutral-100 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
