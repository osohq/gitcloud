import { DeepPartial, getRepository, In } from "typeorm";
import { Request, Response } from "express";
import { Action } from "../entities/Action";

export class ActionController {
  private actionRepository = getRepository(Action);

  async all({ oso, repo, user }: Request, res: Response) {
    // TODO(gj): since there aren't any ABAC conditions modifying the set of
    // actions a user can view, the check for "view_actions" on the parent repo
    // is a more efficient version of the check for "view" on Action.
    if (!(await oso.authorize(user, "view_actions", repo)))
      return res.status(403).send("Forbidden");
    const ids = await oso.list(user, "view", Action);
    const actions = await this.actionRepository
      .createQueryBuilder()
      .where({ id: In(ids), repoId: repo.id })
      .getMany();
    return res.json(actions);
  }

  async save({ body, oso, repo, user }: Request, res: Response) {
    if (!(await oso.authorize(user, "schedule_action", repo)))
      return res.status(403).send("Forbidden");
    let action = this.actionRepository.create({
      ...body,
      creatorId: user.id,
      repoId: repo.id,
    } as DeepPartial<Action>);

    action = await this.actionRepository.save(action);
    await oso.bulkTell([
      ["has_relation", user, "creator", action],
      ["has_relation", action, "repo", repo],
    ]);
    return res.status(201).json(action);
  }

  async cancel({ oso, params, user }: Request, res: Response) {
    const action = await this.actionRepository.findOneOrFail(params.id);
    if (!(await oso.authorize(user, "cancel", action)))
      return res.status(403).send("Forbidden");
    await this.actionRepository.update(action.id, { status: "canceled" });
    return res.json(action);
  }
}
