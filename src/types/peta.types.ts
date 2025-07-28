export interface GeoFeatureProperties {
  id: string;
  name: string;
  prov_id?: string; // hanya untuk kabupaten
}

export interface GeoFeature {
  type: "Feature";
  properties: GeoFeatureProperties;
  geometry: {
    type: string;
    coordinates: any[];
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoFeature[];
}
