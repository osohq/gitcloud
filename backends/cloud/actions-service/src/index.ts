import { readFile } from "fs/promises";

import "reflect-metadata";
import { createConnection } from "typeorm";
import express, { ErrorRequestHandler } from "express";
import session from "cookie-session";
import * as bodyParser from "body-parser";
import cors from "cors";
import { Oso } from "oso-cloud";

import { actionsRouter } from "./routes/actions";
import { sessionRouter } from "./routes/sessions";
import { resetData } from "./test";

class Repo {
  constructor(public readonly id: string) {}
}

class User {
  constructor(public readonly id: string) {}
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
    const polar = await readFile("src/authorization.polar", {
      encoding: "utf8",
    });
    const oso = new Oso(
      "http://localhost:8080",
      "dF8wMTIzNDU2Nzg5Om9zb190ZXN0X3Rva2Vu"
    );
    await oso.policy(polar);

    // create express app
    const app = express();
    app.use(
      cors({
        origin: "http://localhost:3000",
        methods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
        credentials: true,
        allowedHeaders: ["Accept", "Content-Type"],
      })
    );
    app.use(bodyParser.json());

    // Populates req.session
    app.use(
      session({
        // resave: true,
        // saveUninitialized: false,
        secret: "keyboard cat",
        sameSite: true,
      })
    );

    // Make Oso available on request object.
    app.use((req, _resp, next) => {
      // @ts-ignore
      req.oso = oso;
      next();
    });

    app.use("/orgs/:orgId/repos/:repoId/actions", actionsRouter);
    app.use("/session", sessionRouter);

    // Make current user and repo available on request object.
    app.use((req, _resp, next) => {
      // @ts-ignore
      req.user = new User(req.session.userId);
      // @ts-ignore
      req.repo = new Repo(req.params.repoId);
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

    // start express server
    app.listen(5001, "0.0.0.0");
    console.log("Express server has started on port 5001.");
  } catch (e) {
    console.error(e);
  }
})();
