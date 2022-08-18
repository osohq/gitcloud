export type OrgParams = {
  name: string;
  billingAddress: string;
};

export class Org {
  id: number;
  name: string;
  billingAddress?: string;

  constructor({ id, name, billingAddress }: Org) {
    this.id = id;
    this.name = name;
    this.billingAddress = billingAddress;
  }
}
