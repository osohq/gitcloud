import { DataSource } from "typeorm";
// needed for typeorm for some reason
import "reflect-metadata";
import { Action } from "./entities/Action";

export const localDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: true,
  entities: [Action],
});

export const pgDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL + "actions",
  entities: [Action],
});
