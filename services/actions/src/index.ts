import { readFile } from "fs/promises";

import "reflect-metadata";
import { createConnection } from "typeorm";
import express, { ErrorRequestHandler, Request } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { Oso } from "oso-cloud";

import { actionsRouter, Repo } from "./routes/actions";
import { resetData } from "./test";

class User {
  constructor(readonly id: string) {}
}

// Type screwery to get TS to stop complaining.
declare module "express" {
  interface Request {
    oso: Oso;
    repo: Repo;
    user: User;
  }
}

(async function () {
  try {
    const conn = await createConnection();
    await conn.synchronize(true);

    const polar = await readFile("src/authorization.polar", {
      encoding: "utf8",
    });
    const cloudUrl = process.env["OSO_URL"] || "https://cloud.osohq.com";
    const apiToken = process.env["OSO_AUTH"];
    if (!apiToken)
      throw new Error(
        'Missing Oso Cloud API token. Please retrieve an API token from https://cloud.osohq.com/dashboard/ and set it as the "OSO_AUTH" variable in your local environment.'
      );

    const oso = new Oso(cloudUrl, apiToken);
    await oso.policy(polar);

    // create express app
    const app = express();
    app.use(
      cors({
        origin: "http://localhost:3000",
        methods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
        credentials: true,
        allowedHeaders: ["Accept", "Content-Type", "USER"],
      })
    );
    app.use(bodyParser.json());

    // Make current user available on request object.
    app.use((req: Request, res, next) => {
      if (!req.headers["user"]) return res.status(404).send("Not Found");

      req.user = new User(req.header("user"));
      next();
    });

    // Make Oso available on request object.
    app.use((req: Request, _resp, next) => {
      req.oso = oso;
      next();
    });

    app.post(
      "/_reset",
      async (_req, res) =>
        await resetData(conn)
          .then(() => {
            return res.status(200).send("Data loaded");
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).send(err.toString());
          })
    );

    const errorHandler: ErrorRequestHandler = (e, _req, res, next) => {
      if (res.headersSent) {
        console.error(
          "attempting to handle an error after the headers were sent. This is usually a bug."
        );
        return next(e);
      }
      console.error(e.stack);
      res.status(500).send("Something broke!");
    };
    app.use(errorHandler);

    app.use("/orgs/:orgId/repos/:repoId/actions", actionsRouter);

    // start express server
    app.listen(5001, "0.0.0.0");
    console.log("Express server has started on port 5001.");
  } catch (e) {
    console.error(e);
  }
})();
