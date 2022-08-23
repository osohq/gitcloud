export type OrgParams = {
  name: string;
  billingAddress: string;
};

export class Org {
  id: number;
  name: string;
  billingAddress: string;
  repositoryCount: number;
  userCount?: number;

  constructor(org: Org) {
    this.id = org.id;
    this.name = org.name;
    this.billingAddress = org.billingAddress;
    this.repositoryCount = org.repositoryCount;
    this.userCount = org.userCount;
  }
}
