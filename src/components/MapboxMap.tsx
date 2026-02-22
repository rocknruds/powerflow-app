"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 2;

export interface MapboxMapProps {
  /** Mapbox access token (defaults to NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) */
  accessToken?: string;
  /** Initial center [lng, lat] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Optional map style URL */
  style?: string;
  /** Additional class name for the container */
  className?: string;
}

export default function MapboxMap({
  accessToken,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  style = "mapbox://styles/mapbox/light-v11",
  className = "",
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token =
      accessToken ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
    if (!token) {
      console.warn(
        "MapboxMap: No access token. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local"
      );
      return;
    }
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken, style]); // center/zoom only used on init

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] ${className}`}
      aria-label="Map"
    />
  );
}
