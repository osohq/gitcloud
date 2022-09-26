export class Job {
  id: number;
  name: string;
  status: "scheduled" | "running" | "complete" | "canceled";
  repoId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  cancelable: boolean;

  constructor(job: Job) {
    this.id = job.id;
    this.name = job.name;
    this.status = job.status;
    this.repoId = job.repoId;
    this.creatorId = job.creatorId;
    this.createdAt = job.createdAt;
    this.updatedAt = job.updatedAt;
    this.cancelable = job.cancelable;
  }
}
