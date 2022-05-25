import { Request, Router } from "express";
import { SessionController } from "../controllers/SessionController";

// Handles requests made to /sessions
export const sessionRouter = Router();

sessionRouter.get("", function (req: Request, res, _next) {
  return new SessionController().get(req, res);
});

sessionRouter.post("", function (req: Request, res, _next) {
  return new SessionController().create(req, res);
});

sessionRouter.delete("", function (req: Request, res, _next) {
  return new SessionController().delete(req, res);
});
