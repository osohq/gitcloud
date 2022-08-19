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
    if (!(await oso.authorize({ type: "User", id: user.username }, "read", { type: "Repository", id: repo.id })))
      return res.status(404).send("Not Found?");

    // const actionIds = await oso.list({ type: "User", id: user.username }, "view", "Action");
    const actions = await db.createQueryBuilder().select("action").from(Action, "action").where({
      repoId: repo.id
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

    // const cancelableIds: string[] = await oso.list({ type: "User", id: user.username }, "cancel", "Action");
    const cancelableIds = ["*"];

    return res.json(
      actions.map((a) => ({
        ...a,
        cancelable:
          (a.status === "scheduled" || a.status === "running")
          &&
          (cancelableIds.includes(a.id.toString()) ||
            cancelableIds.includes("*")),
      }))
    );
  }

  async save({ body, oso, repo, user }: Request, res: Response) {
    if (!(await oso.authorize({ type: "User", id: user.username }, "manage_actions", { type: "Repository", id: repo.id })))
      return res.status(403).send("Forbidden");
    let action = this.actionRepository().create({
      ...body,
      creatorId: user.username,
      repoId: repo.id,
    } as DeepPartial<Action>);
    action = await this.actionRepository().save(action);
    // await oso.bulkTell([
    //   ["has_relation", { type: "User", id: user.username }, "creator", { type: "Action", id: action.id.toString() }],
    //   ["has_relation", { type: "Action", id: action.id.toString() }, "repository", { type: "Repository", id: repo.id }],
    // ]);
    return res.status(201).json(action);
  }

  async cancel({ oso, params, repo, user }: Request, res: Response) {
    if (!(await oso.authorize({ type: "User", id: user.username }, "manage_actions", { type: "Repository", id: repo.id })))
      return res.status(403).send("Forbidden");
    const action = await this.actionRepository().findOneOrFail({ where: { id: parseInt(params.id) } });
    // if (!(await oso.authorize({ type: "User", id: user.username }, "cancel", { type: "Action", id: action.id.toString() })))
    //   return res.status(403).send("Forbidden");
    await this.actionRepository().update(action.id, { status: "canceled" });
    return res.json(action);
  }
}
