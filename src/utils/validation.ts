// Utility function to validate coordinates
export const isValidCoordinate = (
  longitude: number,
  latitude: number
): boolean => {
  return (
    typeof longitude === "number" &&
    typeof latitude === "number" &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    !isNaN(longitude) &&
    !isNaN(latitude)
  );
};
