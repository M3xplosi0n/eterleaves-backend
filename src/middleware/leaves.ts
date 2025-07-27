import { Request, Response, NextFunction } from "express";
import { isValidCoordinate } from "../utils/validation";

// Middleware to validate coordinate parameters
export const validateCoordinates = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { longitude, latitude } = req.query;

  const lon = parseFloat(longitude as string);
  const lat = parseFloat(latitude as string);

  if (!isValidCoordinate(lon, lat)) {
    res.status(400).json({
      error:
        "Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90",
    });
    return;
  }

  // Add parsed coordinates to the request for further use
  req.query.longitude = lon.toString();
  req.query.latitude = lat.toString();

  next();
};

// Middleware to validate create eter leaf request body
export const validateCreateEterLeaf = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, content, longitude, latitude } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res
      .status(400)
      .json({ error: "Title is required and must be a non-empty string" });
    return;
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res
      .status(400)
      .json({ error: "Content is required and must be a non-empty string" });
    return;
  }

  if (!isValidCoordinate(longitude, latitude)) {
    res.status(400).json({
      error:
        "Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90",
    });
    return;
  }

  next();
};

// Middleware to validate submit signed transaction request body
export const validateSubmitSignedTransaction = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { signedTransaction, latitude, longitude, message } = req.body;

  if (!signedTransaction || !Array.isArray(signedTransaction)) {
    res.status(400).json({
      error: "signedTransaction is required and must be an array",
    });
    return;
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({
      error: "message is required and must be a non-empty string",
    });
    return;
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    res.status(400).json({
      error: "latitude and longitude must be numbers",
    });
    return;
  }

  if (!isValidCoordinate(longitude, latitude)) {
    res.status(400).json({
      error:
        "Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90",
    });
    return;
  }

  next();
};
