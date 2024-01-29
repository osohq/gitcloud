export type RepoParams = {
  name: string;
};

export class Repo {
  id: number;
  name: string;
  orgId: number;
  permissions?: string[];
  public?: boolean;
  role?: string;

  constructor({ id, orgId, name, permissions }: Repo) {
    this.id = id;
    this.orgId = orgId;
    this.name = name;
    this.permissions = permissions;
  }
}
