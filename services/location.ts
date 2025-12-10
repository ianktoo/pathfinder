
export const LocationService = {
  getCurrentPosition: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  },

  // Uses OpenStreetMap Nominatim API (Free, no key required for low volume demo usage)
  getCityFromCoords: async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      
      // Try to find the most relevant city name from the address object
      const address = data.address;
      return address.city || address.town || address.village || address.county || "Unknown Location";
    } catch (error) {
      console.error("Failed to reverse geocode:", error);
      throw new Error("Could not determine city name");
    }
  }
};
