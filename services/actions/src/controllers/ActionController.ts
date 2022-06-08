import { DeepPartial, getRepository, In } from "typeorm";
import { Request, Response } from "express";
import { Action } from "../entities/Action";

const toRun = new Set();
const toComplete = new Set();

export class ActionController {
  private actionRepository = getRepository(Action);

  async all({ oso, repo, user }: Request, res: Response) {
    // NOTE(gj): since there aren't any ABAC conditions modifying the set of
    // actions a user can view, the check for "view_actions" on the parent repo
    // is a more efficient version of the check for "view" on Action.
    if (!(await oso.authorize(user, "view_actions", repo)))
      return res.status(403).send("Forbidden");

    const actionIds = await oso.list(user, "view", Action);
    const actions = await this.actionRepository
      .createQueryBuilder()
      .where({ id: In(actionIds), repoId: repo.id })
      .orderBy("createdAt", "DESC")
      .getMany();

    // Complete running actions.
    actions
      .filter((a) => !toComplete.has(a.id) && a.status === "running")
      .forEach((a) => {
        setTimeout(() => {
          this.actionRepository.update(
            // Only update if status is still 'running'.
            { id: a.id, status: "running" },
            { status: "complete" }
          );
        }, Math.random() * 30_000 + 15_000);
        toComplete.add(a.id);
      });

    // Run scheduled actions.
    actions
      .filter((a) => !toRun.has(a.id) && a.status === "scheduled")
      .forEach((a) => {
        setTimeout(() => {
          this.actionRepository.update(
            // Only update if status is still 'scheduled'.
            { id: a.id, status: "scheduled" },
            { status: "running" }
          );
        }, Math.random() * 10_000 + 2_000);
        toRun.add(a.id);
      });

    const cancelableIds: string[] = await oso.list(user, "cancel", Action);

    return res.json(
      actions.map((a) => ({
        ...a,
        cancelable:
          (a.status === "scheduled" || a.status === "running") &&
          (cancelableIds.includes(a.id.toString()) ||
            cancelableIds.includes("*")),
      }))
    );
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
