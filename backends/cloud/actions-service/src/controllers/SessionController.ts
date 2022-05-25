import { Request, Response } from "express";
import { getRepository } from "typeorm";

export class SessionController {
  // private userRepository = getRepository(User);

  async get(request: Request, res: Response) {
    const user = request.user;
    if (user === undefined) {
      // TODO: Shouldn't this return 401?
      return res.status(200).send({});
    }
    return res.status(200).json(user);
  }

  async create(request: Request, res: Response) {
    const { email } = request.body;
    if (!email) return res.status(500).send("missing email");
    request.session.userId = email;
    return res.status(201).json({ email });
  }

  delete(request: Request, response: Response) {
    request.session = {};
    return response.status(204).json({});
  }
}
