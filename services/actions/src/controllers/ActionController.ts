import { DeepPartial, In } from "typeorm";
import { Request, Response } from "express";
import { Action } from "../entities/Action";
import { db } from "..";

const toRun = new Set();
const toComplete = new Set();

export class ActionController {
  actionRepository() {
    return db.getRepository(Action)
  }

  async all({ oso, repo, user }: Request, res: Response) {
    // NOTE(gj): since there aren't any ABAC conditions modifying the set of
    // actions a user can view, the check for "view_actions" on the parent repo
    // is a more efficient version of the check for "view" on Action.
    if (!(await oso.authorize({ type: "User", id: user.id }, "view_actions", { type: "Repo", id: repo.id })))
      return res.status(403).send("Forbidden");

    const actionIds = await oso.list({ type: "User", id: user.id }, "view", "Action");
    const actions = await db.createQueryBuilder().select("action").from(Action, "action").where({
      id: In(actionIds), repoId: repo.id
    }).orderBy("action.createdAt", "DESC").getMany();

    // Complete running actions.
    actions
      .filter((a) => !toComplete.has(a.id) && a.status === "running")
      .forEach((a) => {
        setTimeout(() => {
          this.actionRepository().update(
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
          this.actionRepository().update(
            // Only update if status is still 'scheduled'.
            { id: a.id, status: "scheduled" },
            { status: "running" }
          );
        }, Math.random() * 10_000 + 2_000);
        toRun.add(a.id);
      });

    const cancelableIds: string[] = await oso.list({ type: "User", id: user.id }, "cancel", "Action");

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
    if (!(await oso.authorize({ type: "User", id: user.id }, "schedule_action", { type: "Repo", id: repo.id })))
      return res.status(403).send("Forbidden");
    let action = this.actionRepository().create({
      ...body,
      creatorId: user.id,
      repoId: repo.id,
    } as DeepPartial<Action>);
    action = await this.actionRepository().save(action);
    await oso.bulkTell([
      ["has_relation", { type: "User", id: user.id }, "creator", { type: "Action", id: action.id.toString() }],
      ["has_relation", { type: "Action", id: action.id.toString() }, "repo", { type: "Repo", id: repo.id }],
    ]);
    return res.status(201).json(action);
  }

  async cancel({ oso, params, user }: Request, res: Response) {
    const action = await this.actionRepository().findOneOrFail({ where: { id: parseInt(params.id) } });
    if (!(await oso.authorize({ type: "User", id: user.id }, "cancel", { type: "Action", id: action.id.toString() })))
      return res.status(403).send("Forbidden");
    await this.actionRepository().update(action.id, { status: "canceled" });
    return res.json(action);
  }
}
