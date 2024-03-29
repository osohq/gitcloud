import { DataSource } from "typeorm";
// needed for typeorm for some reason
import "reflect-metadata";
import { Job } from "./entities/Job";

export const localDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true,
    entities: [Job],
});
