import { getRepository, In } from "typeorm";
import { Request, Response } from "express";
import { Action } from "../entities/Action";

export class ActionController {
  private actionRepository = getRepository(Action);

  async all({ oso, repo, user }: Request, res: Response) {
    if (!(await oso.authorize(user, "list_actions", repo)))
      return res.status(403).send("Forbidden");
    const ids = await oso.list(user, "read", Action);
    return this.actionRepository
      .createQueryBuilder()
      .where({ id: In(ids) })
      .getMany();
  }

  async one({ oso, params, user }: Request, res: Response) {
    const action = await this.actionRepository.findOneOrFail(params.id);
    if (!(await oso.authorize(user, "read", action)))
      return res.status(403).send("Forbidden");
    return action;
  }

  async save({ body, oso, repo, user }: Request, res: Response) {
    if (!(await oso.authorize(user, "schedule_actions", repo)))
      return res.status(403).send("Forbidden");
    const params = {
      ...body,
      creatorId: user.id,
      repoId: repo.id,
    };
    const action = await this.actionRepository.save(params);
    return res.status(201).send(action);
  }

  async cancel({ oso, params, user }: Request, res: Response) {
    const action = await this.actionRepository.findOneOrFail(params.id);
    if (!(await oso.authorize(user, "cancel", action)))
      return res.status(403).send("Forbidden");
    await this.actionRepository.update(action.id, { status: "canceled" });
    return action;
  }
}
