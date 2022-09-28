import { Request, Router } from "express";
import { JobController } from "../controllers/JobController";

export class Repo {
  constructor(readonly id: string) { }
}

// Handles requests made to /jobs
export const jobsRouter = Router({ mergeParams: true });

// Make current repo available on request object.
jobsRouter.use((req: Request, _res, next) => {
  req.repo = new Repo(req.params.repoId);
  next();
});

jobsRouter.get("", async (req: Request, res, _next) =>
  new JobController().all(req, res)
);
jobsRouter.post("", (req: Request, res, _next) =>
  new JobController().save(req, res)
);
jobsRouter.patch("/:id/cancel", (req: Request, res, _next) =>
  new JobController().cancel(req, res)
);
