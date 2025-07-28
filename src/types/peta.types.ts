export interface FeatureProperties {
  province_kemendagri_code?: string;
  province_bps_code?: string;
  province_kemendagri_name?: string;
  province_bps_name?: string;
  regency_kemendagri_code?: string;
  regency_bps_code?: string;
  regency_kemendagri_name?: string;
  regency_bps_name?: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: FeatureProperties;
  geometry: any;
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}