// Default values and constants
export const DEFAULT_RADIUS_METERS = 1000;
export const MAX_RADIUS_METERS = 10000;
export const MIN_RADIUS_METERS = 10;

// Coordinate boundaries
export const COORDINATE_BOUNDS = {
  longitude: { min: -180, max: 180 },
  latitude: { min: -90, max: 90 },
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  title: { minLength: 1, maxLength: 255 },
  content: { minLength: 1, maxLength: 5000 },
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
