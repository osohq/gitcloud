export class Action {
  id: number;
  name: string;
  status: "scheduled" | "running" | "complete" | "canceled";
  repoId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  cancelable: boolean;

  constructor(action: Action) {
    this.id = action.id;
    this.name = action.name;
    this.status = action.status;
    this.repoId = action.repoId;
    this.creatorId = action.creatorId;
    this.createdAt = action.createdAt;
    this.updatedAt = action.updatedAt;
    this.cancelable = action.cancelable;
  }
}
