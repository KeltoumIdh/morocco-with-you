import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { googleMapsSearchUrl } from "../../utils/itineraryHelpers";

/** Set `VITE_ITINERARY_ROUTE_MAP_COMING_SOON=0` in `.env` to use the live OpenStreetMap view. */
const ROUTE_MAP_VISUAL_COMING_SOON =
  import.meta.env.VITE_ITINERARY_ROUTE_MAP_COMING_SOON !== "0";

const MARRAKECH_ROUTE_PREVIEW_SRC = "/images/marrakech-route-coming-soon.png";

function FitRoute({ stops }) {
  const map = useMap();
  useEffect(() => {
    const pts = stops
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
      .map((s) => [s.lat, s.lng]);
    if (!pts.length) {
      map.setView([31.5, -7.5], 6);
      return;
    }
    if (pts.length === 1) {
      map.setView(pts[0], 8);
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 9 });
  }, [map, stops]);
  return null;
}

/**
 * Map of ordered trip stops + list; each stop opens Google Maps search.
 */
export default function ItineraryRouteMap({ stops }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const linePositions = useMemo(
    () =>
      stops
        .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
        .map((s) => [s.lat, s.lng]),
    [stops]
  );

  const mapKey = useMemo(() => stops.map((s) => `${s.key}-${s.order}`).join("|") || "empty", [stops]);

  if (!stops.length) {
    return (
      <div
        className="rounded-2xl p-5 text-sm"
        style={{ background: "var(--sand)", border: "1px solid var(--clay)", color: "var(--smoke)" }}
      >
        No recognizable places yet — when activities mention cities (e.g. Marrakech, Essaouira), they will
        appear here with map links.
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--clay)" }}>
      <div className="relative w-full" style={{ height: 260, zIndex: 0 }}>
        {ROUTE_MAP_VISUAL_COMING_SOON ? (
          <div className="relative h-full w-full overflow-hidden" style={{ background: "var(--light-clay)" }}>
            <img
              src={MARRAKECH_ROUTE_PREVIEW_SRC}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              decoding="async"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(26,20,16,.55) 0%, rgba(26,20,16,.12) 45%, transparent 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-wrap items-end justify-between gap-2">
              <p className="text-xs font-medium m-0 max-w-[70%]" style={{ color: "rgba(255,255,255,.95)", textShadow: "0 1px 8px rgba(0,0,0,.45)" }}>
                Guided route map — Marrakech-style preview. Your real stops are listed below with Google Maps links.
              </p>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: "rgba(250,246,238,.95)", color: "var(--terracotta)", letterSpacing: ".14em" }}
              >
                Coming soon
              </span>
            </div>
          </div>
        ) : (
          <MapContainer
            key={mapKey}
            center={[31.5, -7.5]}
            zoom={6}
            className="h-full w-full"
            style={{ background: "var(--light-clay)" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitRoute stops={stops} />
            {linePositions.length >= 2 && (
              <Polyline
                positions={linePositions}
                pathOptions={{ color: "#c0654a", weight: 3, opacity: 0.85 }}
              />
            )}
            {stops
              .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
              .map((s) => {
                const active = selectedOrder === s.order;
                return (
                  <CircleMarker
                    key={`${s.key}-${s.order}`}
                    center={[s.lat, s.lng]}
                    radius={active ? 11 : 7}
                    pathOptions={{
                      color: "#1a1410",
                      weight: 2,
                      fillColor: active ? "#d4a853" : "#c0654a",
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{
                      click: () => setSelectedOrder(s.order),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false}>
                      <span style={{ fontWeight: 700 }}>{s.order}. {s.label}</span>
                      {s.day != null ? <span style={{ display: "block", fontSize: 11 }}>Day {s.day}</span> : null}
                    </Tooltip>
                  </CircleMarker>
                );
              })}
          </MapContainer>
        )}
      </div>

      <div className="p-4 space-y-2" style={{ background: "var(--parchment)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--terracotta)", letterSpacing: ".1em" }}>
          {ROUTE_MAP_VISUAL_COMING_SOON ? "Your route stops" : "Route · tap to highlight"}
        </p>
        <ol className="space-y-2 list-none m-0 p-0">
          {stops.map((s) => {
            const active = selectedOrder === s.order;
            const mapsUrl = googleMapsSearchUrl(s.placeQuery);
            return (
              <li key={`${s.key}-${s.order}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedOrder(s.order)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedOrder(s.order);
                    }
                  }}
                  className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  style={{
                    background: active ? "rgba(192,101,74,.12)" : "var(--sand)",
                    border: active ? "1.5px solid var(--terracotta)" : "1px solid var(--clay)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: active ? "var(--terracotta)" : "var(--light-clay)",
                        color: active ? "#fff" : "var(--ink)",
                      }}
                    >
                      {s.order}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                        {s.label}
                      </p>
                      {s.day != null && (
                        <p className="text-xs truncate" style={{ color: "var(--smoke)" }}>
                          First in itinerary · Day {s.day}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap"
                    style={{ background: "var(--light-clay)", color: "var(--terracotta)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Google Maps
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
