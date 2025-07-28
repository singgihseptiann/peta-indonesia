import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./styles/leaflet.css";

// Import your JSON data files
import provincesData from "../../assets/geojson/provinces.json";
import regenciesData from "../../assets/geojson/kab_kota_simple.json";

// Types
interface FeatureProperties {
  province_kemendagri_code?: string;
  province_bps_code?: string;
  province_kemendagri_name?: string;
  province_bps_name?: string;
  regency_kemendagri_code?: string;
  regency_bps_code?: string;
  regency_kemendagri_name?: string;
  regency_bps_name?: string;
}

interface GeoJSONFeature {
  type: "Feature";
  properties: FeatureProperties;
  geometry: any;
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface SelectedProvinceData {
  code: string;
  name: string;
}

interface LeafletMapProps {
  onProvinceSelect?: (code: string, name: string) => void;
  onCitySelect?: (code: string, name: string, provinceCode: string) => void;
  selectedProvince?: string;
}

type MapLevel = "province" | "regency";

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LeafletMap: React.FC<LeafletMapProps> = ({
  onProvinceSelect,
  onCitySelect,
  selectedProvince,
}) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<MapLevel>("province");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProvinceData, setSelectedProvinceData] =
    useState<SelectedProvinceData | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Update map when selectedProvince changes from parent
  useEffect(() => {
    if (selectedProvince && currentLevel === "province") {
      const loadSelectedProvince = () => {
        const provinceFeature = geoJsonData?.features?.find(
          (feature) => getFeatureCode(feature, "province") === selectedProvince
        );

        if (provinceFeature) {
          const provinceCode = getFeatureCode(provinceFeature, "province");
          const provinceName = getFeatureName(provinceFeature, "province");
          setSelectedProvinceData({ code: provinceCode!, name: provinceName });

          const regenciesForProvince = loadRegenciesData(provinceCode!);
          if (
            regenciesForProvince &&
            regenciesForProvince.features.length > 0
          ) {
            setCurrentLevel("regency");
            setGeoJsonData(regenciesForProvince);

            // Update map bounds after GeoJSON data is set
            if (mapRef.current) {
              const bounds = L.geoJSON(regenciesForProvince).getBounds();
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          } else {
            onProvinceSelect?.(provinceCode!, provinceName);
          }
        }
      };

      if (geoJsonData) {
        loadSelectedProvince();
      }
    }
  }, [selectedProvince, geoJsonData, currentLevel, onProvinceSelect]);

  // Load regencies data for selected province
  const loadRegenciesData = (
    selectedProvinceCode: string
  ): GeoJSONData | null => {
    try {
      setLoading(true);

      const filteredFeatures = regenciesData.features.filter((feature: any) => {
        const props = feature.properties;
        return (
          props.province_kemendagri_code === selectedProvinceCode ||
          props.province_bps_code === selectedProvinceCode
        );
      });

      console.log(
        `Found ${filteredFeatures.length} regencies for province ${selectedProvinceCode}`
      );

      if (filteredFeatures.length === 0) {
        console.warn("No regencies found for province:", selectedProvinceCode);
        return null;
      }

      return {
        type: "FeatureCollection",
        features: filteredFeatures,
      };
    } catch (error) {
      console.error("Error loading regencies data:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Style function for GeoJSON features - Blue sky theme with high contrast
  const style = (feature: GeoJSONFeature): L.PathOptions => {
    const isSelected =
      selectedProvince === getFeatureCode(feature, currentLevel);
    return {
      fillColor: isSelected ? "#1e40af" : "#dbeafe",
      weight: 1.5,
      opacity: 1,
      color: isSelected ? "#1e3a8a" : "#3b82f6",
      fillOpacity: isSelected ? 0.9 : 0.7,
    };
  };

  // Get feature name based on level
  const getFeatureName = (feature: GeoJSONFeature, level: MapLevel): string => {
    const props = feature.properties;
    if (level === "province") {
      return (
        props.province_kemendagri_name ||
        props.province_bps_name ||
        "Provinsi Tidak Diketahui"
      );
    }
    if (level === "regency") {
      return (
        props.regency_kemendagri_name ||
        props.regency_bps_name ||
        "Kabupaten/Kota Tidak Diketahui"
      );
    }
    return "Tidak Diketahui";
  };

  // Get feature code based on level
  const getFeatureCode = (
    feature: GeoJSONFeature,
    level: MapLevel
  ): string | null => {
    const props = feature.properties;
    if (level === "province") {
      return props.province_kemendagri_code || props.province_bps_code || null;
    }
    if (level === "regency") {
      return props.regency_kemendagri_code || props.regency_bps_code || null;
    }
    return null;
  };

  // Handle feature click
  const onFeatureClick = (e: L.LeafletMouseEvent, feature: GeoJSONFeature) => {
    if (currentLevel === "province") {
      const provinceCode = getFeatureCode(feature, "province");
      const provinceName = getFeatureName(feature, "province");

      if (!provinceCode) return;

      setSelectedProvinceData({ code: provinceCode, name: provinceName });

      const regenciesForProvince = loadRegenciesData(provinceCode);
      if (regenciesForProvince && regenciesForProvince.features.length > 0) {
        try {
          // Create temporary layer to calculate bounds
          const tempLayer = L.geoJSON(regenciesForProvince);
          const bounds = tempLayer.getBounds();

          // Get map reference
          if (!mapRef.current) {
            console.error("Map reference not found");
            return;
          }

          // Update state after ensuring we have valid bounds
          setCurrentLevel("regency");
          setGeoJsonData(regenciesForProvince);

          // Fit bounds with padding and animation
          mapRef.current.fitBounds(bounds, {
            padding: [50, 50],
            animate: true,
            duration: 1,
            maxZoom: 10, // Prevent excessive zoom
          });

          // Force a re-render of the GeoJSON layer
          mapRef.current.invalidateSize();
        } catch (error) {
          console.error("Error switching to regency view:", error);
          onProvinceSelect?.(provinceCode, provinceName);
        }
      } else {
        console.warn("No regency data available for province:", provinceCode);
        onProvinceSelect?.(provinceCode, provinceName);
      }
    } else if (currentLevel === "regency") {
      const regencyCode = getFeatureCode(feature, "regency");
      const regencyName = getFeatureName(feature, "regency");
      const provinceCode = selectedProvinceData?.code;

      if (regencyCode && provinceCode) {
        const fullRegencyCode = `${provinceCode}.${regencyCode}`;
        onCitySelect?.(fullRegencyCode, regencyName, provinceCode);
      }
    }
  };

  // Reset to provinces view
  const resetToProvinces = () => {
    try {
      setLoading(true);
      setCurrentLevel("province");
      setSelectedProvinceData(null);
      setGeoJsonData(provincesData as GeoJSONData);

      // Reset map view to Indonesia using stored reference
      if (mapRef.current) {
        mapRef.current.setView([-2.0, 118.0], 5, {
          animate: true,
          duration: 1,
        });
        mapRef.current.invalidateSize();
      }
    } catch (error) {
      console.error("Error resetting to provinces view:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map data
  useEffect(() => {
    const initializeMap = () => {
      setGeoJsonData(provincesData as GeoJSONData);
      setLoading(false);
    };
    initializeMap();
  }, []);

  if (!geoJsonData) return null;

  return (
    <div className="map-container">
      {loading && <div className="loading-overlay">Memuat data...</div>}
      <MapContainer
        center={[-2.0, 118.0]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        minZoom={4}
        maxZoom={12}
        zoomControl={true}
        doubleClickZoom={false}
        whenReady={(e) => {
          // Store map instance when it's ready
          mapRef.current = e.target;
        }}
      >
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {!loading && geoJsonData && (
          <GeoJSON
            key={`${currentLevel}-${selectedProvince || "none"}`}
            data={geoJsonData}
            style={style}
            onEachFeature={(feature: GeoJSONFeature, layer: L.Layer) => {
              const leafletLayer = layer as L.Path;

              // Optimize event listeners
              const events = {
                click: (e: L.LeafletMouseEvent) => onFeatureClick(e, feature),
                mouseover: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  const isSelected =
                    selectedProvince === getFeatureCode(feature, currentLevel);
                  target.setStyle({
                    fillColor: isSelected ? "#1e3a8a" : "#60a5fa",
                    fillOpacity: 1,
                    weight: 2.5,
                    color: isSelected ? "#1e3a8a" : "#2563eb",
                  });
                  target.bringToFront();
                },
                mouseout: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle(style(feature));
                },
              };

              leafletLayer.on(events);

              // Add tooltip only if not in mobile view
              if (window.innerWidth > 768) {
                leafletLayer.bindTooltip(
                  getFeatureName(feature, currentLevel),
                  {
                    permanent: false,
                    direction: "top",
                    className: "map-tooltip",
                  }
                );
              }
            }}
          />
        )}
      </MapContainer>
      {currentLevel === "regency" && (
        <button onClick={resetToProvinces} className="back-button">
          ← Kembali ke Provinsi
        </button>
      )}
    </div>
  );
};

export default LeafletMap;
