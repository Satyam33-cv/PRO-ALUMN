/**
 * 100% Free Offline Geo-Coordinate Pipeline for Leaflet OpenStreetMap
 * Resolves alumni locations to latitude/longitude without any external API keys or charges.
 */

const KNOWN_LOCATIONS = {
  // India Tech Hubs
  mumbai: { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  bombay: { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  bengaluru: { city: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946 },
  bangalore: { city: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946 },
  pune: { city: 'Pune', country: 'India', lat: 18.5204, lng: 73.8567 },
  delhi: { city: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
  noida: { city: 'Noida', country: 'India', lat: 28.5355, lng: 77.3910 },
  gurgaon: { city: 'Gurugram', country: 'India', lat: 28.4595, lng: 77.0266 },
  gurugram: { city: 'Gurugram', country: 'India', lat: 28.4595, lng: 77.0266 },
  hyderabad: { city: 'Hyderabad', country: 'India', lat: 17.3850, lng: 78.4867 },
  chennai: { city: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707 },
  madras: { city: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707 },
  kolkata: { city: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639 },
  calcutta: { city: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639 },
  ahmedabad: { city: 'Ahmedabad', country: 'India', lat: 23.0225, lng: 72.5714 },
  jaipur: { city: 'Jaipur', country: 'India', lat: 26.9124, lng: 75.7873 },
  chandigarh: { city: 'Chandigarh', country: 'India', lat: 30.7333, lng: 76.7794 },
  kochi: { city: 'Kochi', country: 'India', lat: 9.9312, lng: 76.2673 },
  trivandrum: { city: 'Thiruvananthapuram', country: 'India', lat: 8.5241, lng: 76.9366 },
  thiruvananthapuram: { city: 'Thiruvananthapuram', country: 'India', lat: 8.5241, lng: 76.9366 },
  goa: { city: 'Goa', country: 'India', lat: 15.2993, lng: 74.1240 },
  nagpur: { city: 'Nagpur', country: 'India', lat: 21.1458, lng: 79.0882 },
  indore: { city: 'Indore', country: 'India', lat: 22.7196, lng: 75.8577 },

  // USA & Americas
  'san francisco': { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  'mountain view': { city: 'Mountain View', country: 'USA', lat: 37.3861, lng: -122.0839 },
  sunnyvale: { city: 'Sunnyvale', country: 'USA', lat: 37.3688, lng: -122.0363 },
  'san jose': { city: 'San Jose', country: 'USA', lat: 37.3382, lng: -121.8863 },
  seattle: { city: 'Seattle', country: 'USA', lat: 47.6062, lng: -122.3321 },
  'new york': { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  nyc: { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  boston: { city: 'Boston', country: 'USA', lat: 42.3601, lng: -71.0589 },
  austin: { city: 'Austin', country: 'USA', lat: 30.2672, lng: -97.7431 },
  chicago: { city: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
  'los angeles': { city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  toronto: { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  vancouver: { city: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },

  // Europe & Global
  london: { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  dublin: { city: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  berlin: { city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  munich: { city: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },
  amsterdam: { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  zurich: { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  paris: { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  singapore: { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  tokyo: { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  sydney: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  melbourne: { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  dubai: { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
};

/**
 * Resolve arbitrary location string into coordinates
 * @param {string} rawLocation
 * @returns {{ city: string, country: string, lat: number, lng: number } | null}
 */
function resolveCoordinates(rawLocation) {
  if (!rawLocation || typeof rawLocation !== 'string') return null;
  const cleaned = rawLocation.toLowerCase().trim();

  // 1. Direct match
  if (KNOWN_LOCATIONS[cleaned]) {
    return { ...KNOWN_LOCATIONS[cleaned] };
  }

  // 2. Keyword check across known city keys (longer keys checked first to avoid partial conflicts)
  const sortedKeys = Object.keys(KNOWN_LOCATIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (cleaned.includes(key)) {
      return { ...KNOWN_LOCATIONS[key] };
    }
  }

  // Fallback default coordinate near Mumbai university campus if unknown
  return null;
}

module.exports = {
  KNOWN_LOCATIONS,
  resolveCoordinates,
};
