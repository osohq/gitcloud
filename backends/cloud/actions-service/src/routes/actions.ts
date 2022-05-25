import { Request, Router } from "express";
import { ActionController } from "../controllers/ActionController";

// Handles requests made to /actions
export const actionsRouter = Router({ mergeParams: true });

actionsRouter.get("", (req: Request, res, _next) =>
  new ActionController().all(req, res)
);
actionsRouter.get("/:id", (req: Request, res, _next) =>
  new ActionController().one(req, res)
);
actionsRouter.post("", (req: Request, res, _next) =>
  new ActionController().save(req, res)
);
actionsRouter.put("/:id/cancel", (req: Request, res, _next) =>
  new ActionController().cancel(req, res)
);
