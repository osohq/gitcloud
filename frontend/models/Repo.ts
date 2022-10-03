export type RepoParams = {
  name: string;
}

export class Repo {
  id: number;
  name: string;
  orgId: number;
  issueCount: number
  permissions?: string[];
  public?: boolean;
  role?: string;

  constructor({ id, orgId, name, issueCount, permissions }: Repo) {
    this.id = id;
    this.orgId = orgId;
    this.name = name;
    this.issueCount = issueCount;
    this.permissions = permissions;
  }
}
