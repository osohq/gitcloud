import { Org } from "../models";
import type { OrgParams as Params } from "../models";
import { create, index, noData, show } from "./common";

const path = `/orgs`;

export const org = {
  create: (body: Params) => create(path, body, Org),

  index: () => index(path, Org),

  show: (id?: string) => id ? show(`${path}/${id}`, Org) : noData()
};
