import { DeepPartial, In } from "typeorm";
import { Request, Response } from "express";
import { Job } from "../entities/Job";
import { db } from "..";

const toRun = new Set();
const toComplete = new Set();

export class JobController {
  jobRepository() {
    return db.getRepository(Job);
  }

  async all({ oso, repo, user }: Request, res: Response) {
    if (
      !(await oso.authorize({ type: "User", id: user.username }, "read", {
        type: "Repository",
        id: repo.id,
      }))
    )
      return res.status(404).send("Not Found?");

    // const jobIds = await oso.list({ type: "User", id: user.username }, "view", "Job");
    const jobs = await db
      .createQueryBuilder()
      .select("job")
      .from(Job, "job")
      .where({
        repoId: repo.id,
      })
      .orderBy("job.createdAt", "DESC")
      .getMany();

    // Complete running jobs.
    jobs
      .filter((a) => !toComplete.has(a.id) && a.status === "running")
      .forEach((a) => {
        setTimeout(() => {
          this.jobRepository().update(
            // Only update if status is still 'running'.
            { id: a.id, status: "running" },
            { status: Math.random() < 0.1 ? "failed" : "complete" }
          );
        }, Math.random() * 30_000 + 15_000);
        toComplete.add(a.id);
      });

    // Run scheduled jobs.
    jobs
      .filter((a) => !toRun.has(a.id) && a.status === "scheduled")
      .forEach((a) => {
        setTimeout(() => {
          this.jobRepository().update(
            // Only update if status is still 'scheduled'.
            { id: a.id, status: "scheduled" },
            { status: "running" }
          );
        }, Math.random() * 10_000 + 2_000);
        toRun.add(a.id);
      });

    // const cancelableIds: string[] = await oso.list({ type: "User", id: user.username }, "cancel", "Job");
    const cancelableIds = ["*"];

    return res.json(
      jobs.map((a) => ({
        ...a,
        cancelable:
          (a.status === "scheduled" || a.status === "running") &&
          (cancelableIds.includes(a.id.toString()) ||
            cancelableIds.includes("*")),
      }))
    );
  }

  async save({ body, oso, repo, user }: Request, res: Response) {
    if (
      !(await oso.authorize(
        { type: "User", id: user.username },
        "manage_jobs",
        { type: "Repository", id: repo.id }
      ))
    )
      return res.status(403).send("Forbidden");
    let job = this.jobRepository().create({
      ...body,
      creatorId: user.username,
      repoId: repo.id,
    } as DeepPartial<Job>);
    job = await this.jobRepository().save(job);
    // await oso.bulkTell([
    //   ["has_relation", { type: "User", id: user.username }, "creator", { type: "Job", id: job.id.toString() }],
    //   ["has_relation", { type: "Job", id: job.id.toString() }, "repository", { type: "Repository", id: repo.id }],
    // ]);
    return res.status(201).json(job);
  }

  async cancel({ oso, params, repo, user }: Request, res: Response) {
    if (
      !(await oso.authorize(
        { type: "User", id: user.username },
        "manage_jobs",
        { type: "Repository", id: repo.id }
      ))
    )
      return res.status(403).send("Forbidden");
    const job = await this.jobRepository().findOneOrFail({
      where: { id: parseInt(params.id) },
    });
    // if (!(await oso.authorize({ type: "User", id: user.username }, "cancel", { type: "Job", id: job.id.toString() })))
    //   return res.status(403).send("Forbidden");
    await this.jobRepository().update(job.id, { status: "canceled" });
    return res.json(job);
  }
}
