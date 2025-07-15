import { Model } from "objection";

export class EterLeaf extends Model {
  id!: number;
  title!: string;
  content!: string;
  location!: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  created_at!: string;

  static get tableName() {
    return "eter_leaves";
  }
}
