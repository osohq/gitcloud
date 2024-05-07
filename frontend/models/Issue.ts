export class Issue {
  id: number;
  issueNumber: number;
  title: string;
  creatorId?: string;
  permissions?: string[];
  repoId: number;
  closed: boolean;

  constructor({
    id,
    title,
    creatorId,
    permissions,
    issueNumber,
    repoId,
    closed,
  }: Issue) {
    this.id = id;
    this.title = title;
    this.creatorId = creatorId;
    this.permissions = permissions;
    this.issueNumber = issueNumber;
    this.repoId = repoId;
    this.closed = closed;
  }
}
