import { Request, Router } from "express";
import { ActionController } from "../controllers/ActionController";

export class Repo {
  readonly type: string = 'Repo';
  constructor(readonly id: string) {}
}

// Handles requests made to /actions
export const actionsRouter = Router({ mergeParams: true });

// Make current repo available on request object.
actionsRouter.use((req: Request, _res, next) => {
  req.repo = new Repo(req.params.repoId);
  next();
});

actionsRouter.get("", async (req: Request, res, _next) =>
  new ActionController().all(req, res)
);
actionsRouter.post("", (req: Request, res, _next) =>
  new ActionController().save(req, res)
);
actionsRouter.patch("/:id/cancel", (req: Request, res, _next) =>
  new ActionController().cancel(req, res)
);
