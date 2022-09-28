export class Issue {
  id: number;
  issueNumber: number;
  title: string;
  creator_id?: string;
  permissions?: string[];
  repoId: number;
  closed: boolean;

  constructor({ id, title, permissions, issueNumber, repoId, closed }: Issue) {
    this.id = id;
    this.title = title;
    this.permissions = permissions;
    this.issueNumber = issueNumber;
    this.repoId = repoId;
    this.closed = closed;
  }
}
