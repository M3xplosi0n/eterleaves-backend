import express from "express";
import "./db";
import knex from "./db";

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/eter_leaves", async (req, res) => {
  const { title, content, longitude, latitude } = req.body;

  const [newSpot] = await knex("eter_leaves")
    .insert({
      title,
      content,
      location: knex.raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)", [
        longitude,
        latitude,
      ]),
    })
    .returning("*");

  res.status(201).json(newSpot);
});

app.get("/api/eter_leaves", async (_, res) => {
  const spots = await knex
    .select(
      "id",
      "title",
      "content",
      "created_at",
      knex.raw("ST_AsGeoJSON(location)::json as location")
    )
    .from("eter_leaves");

  res.json(spots);
});

app.get("/api/eter_leaves/near", async (req, res) => {
  const { longitude, latitude } = req.query;
  const radiusMeters = 1000;

  const spots = await knex
    .select(
      "id",
      "title",
      "content",
      "created_at",
      knex.raw("ST_AsGeoJSON(location)::json as location")
    )
    .from("eter_leaves")
    .whereRaw("ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326), ?)", [
      longitude,
      latitude,
      radiusMeters,
    ]);

  res.json(spots);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
