import express, { ErrorRequestHandler, Request } from "express";
import http, { Server } from "http";
import * as bodyParser from "body-parser";
import cors from "cors";
import { Oso } from "oso-cloud";
import { ApolloServer, gql } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import { loadFiles } from "@graphql-tools/load-files";

import { jobsRouter, Repo } from "./routes/jobs";
import { resetData } from "./test";
import { pgDataSource } from "./prodDb";
import { localDataSource } from "./localDb";
import { RdbmsSchemaBuilder } from "typeorm/schema-builder/RdbmsSchemaBuilder";
import { Job } from "./entities/Job";
import { DeepPartial } from "typeorm/common/DeepPartial";
const path = require("path");

class User {
  constructor(readonly username: string) {}
}

// Type screwery to get TS to stop complaining.
declare module "express" {
  interface Request {
    oso: Oso;
    repo: Repo;
    user: User;
  }
}

const PRODUCTION = process.env.PRODUCTION == "1";
const PRODUCTION_DB = process.env.PRODUCTION_DB == "1";
// const TRACING = process.env.TRACING == "1";
const WEB_URL = PRODUCTION
  ? "https://gitcloud.vercel.app"
  : process.env.WEB_URL || "http://localhost:8000";

export const db = PRODUCTION_DB ? pgDataSource : localDataSource;

(async function () {
  try {
    await db.initialize();

    const cloudUrl = process.env["OSO_URL"] || "https://cloud.osohq.com";
    const apiToken = process.env["OSO_AUTH"];
    if (!apiToken)
      throw new Error(
        'Missing Oso Cloud API token. Please retrieve an API token from https://cloud.osohq.com/dashboard/ and set it as the "OSO_AUTH" variable in your local environment.'
      );

    const oso = new Oso(cloudUrl, apiToken);

    // create express app
    const app = express();

    app.use(
      cors({
        origin: WEB_URL,
        methods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
        credentials: true,
        allowedHeaders: ["Accept", "Content-Type", "x-user-id"],
      })
    );
    app.use(bodyParser.json());

    // Make current user available on request object.
    app.use((req: Request, res, next) => {
      if (req.path == "/graphql") {
        return next();
      }

      if (!req.headers["x-user-id"]) return res.status(404).send("Not Found");

      req.user = new User(req.header("x-user-id"));
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
        await resetData(db)
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

    app.use("/orgs/:orgId/repos/:repoId/jobs", jobsRouter);

    // start express server
    const graphQLServer = new ApolloServer({
      typeDefs: await loadFiles(path.join(__dirname, "*.graphql")),
      context: ({ req }) => {
        return {
          username: req?.user?.username,
        };
      },
      resolvers: {
        Mutation: {
          createJob: async (parent, args, context, info) => {
            const jobsRepo = db.getRepository(Job);
            let { name, repoId } = args;
            let job = jobsRepo.create({
              status: "scheduled",
              repoId,
              name,
              creatorId: context.username || "unknown",
            } as DeepPartial<Job>);
            job = await jobsRepo.save(job);
            return job;
          },
          cancelJob: async (parent, args, context, info) => {
            const jobsRepo = db.getRepository(Job);
            const job = await jobsRepo.findOneOrFail({
              where: { id: parseInt(args.id) },
            });
            await jobsRepo.update(job.id, { status: "canceled" });

            const cancelled = await jobsRepo.findOneBy({ id: job.id });
            return cancelled;
          },
        },
        Query: {
          listJobs: async (parent, args, context, info) => {
            const jobs = await db
              .createQueryBuilder()
              .select("job")
              .from(Job, "job")
              .where({
                repoId: args.repoId,
              })
              .orderBy("job.createdAt", "DESC")
              .getMany();

            // const cancelableIds: string[] = await oso.list({ type: "User", id: user.username }, "cancel", "Job");
            const cancelableIds = ["*"];

            return jobs.map((a) => ({
              ...a,
              cancelable:
                (a.status === "scheduled" || a.status === "running") &&
                (cancelableIds.includes(a.id.toString()) ||
                  cancelableIds.includes("*")),
            }));
          },
        },
      },
      introspection: true,
      plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    });
    await graphQLServer.start();
    graphQLServer.applyMiddleware({ app, path: "/graphql" });
    await app.listen(5001, "0.0.0.0");

    console.log(
      `🚀 Server ready at http://localhost:5001${graphQLServer.graphqlPath}`
    );
  } catch (e) {
    console.error(e);
  }
})();
