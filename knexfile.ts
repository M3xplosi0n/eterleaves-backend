import { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      host: "localhost",
      port: 5432,
      user: "admin",
      password: "Password1!@",
      database: "eterleaves_db",
    },
    migrations: {
      directory: "./migrations",
    },
  },
};

export default config;
