export class Repo {
  id: number;
  name: string;
  orgId: number;
  issueCount: number

  constructor({ id, orgId, name, issueCount }: Repo) {
    this.id = id;
    this.orgId = orgId;
    this.name = name;
    this.issueCount = issueCount;
  }
}
