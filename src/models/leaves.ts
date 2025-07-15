import { Model } from "objection";

export class EterLeaf extends Model {
  id!: number;
  title!: string;
  content!: string;
  location!: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  created_at!: Date;

  static get tableName() {
    return "eter_leaves";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["title", "content"],
      properties: {
        id: { type: "integer" },
        title: { type: "string", minLength: 1 },
        content: { type: "string", minLength: 1 },
        location: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["Point"] },
            coordinates: {
              type: "array",
              items: { type: "number" },
              minItems: 2,
              maxItems: 2,
            },
          },
        },
        created_at: { type: "string" },
      },
    };
  }

  // Metodo per creare un punto geografico
  static createLocation(longitude: number, latitude: number) {
    return this.knex().raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)", [
      longitude,
      latitude,
    ]);
  }

  // Metodo per selezionare la location come GeoJSON
  static selectWithLocation() {
    return this.query().select(
      "id",
      "title",
      "content",
      "created_at",
      this.knex().raw("ST_AsGeoJSON(location)::json as location")
    );
  }

  // Metodo per trovare punti vicini
  static findNearby(longitude: number, latitude: number, radius: number) {
    return this.selectWithLocation().whereRaw(
      "ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326), ?)",
      [longitude, latitude, radius]
    );
  }
}
