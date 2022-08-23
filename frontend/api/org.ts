import { Org } from "../models";
import type { OrgParams as Params } from "../models";
import { create, get, index, noData, show } from "./common";

const path = `/orgs`;

export const org = {
  create: (body: Params) => create(path, body, Org),

  index: (params?: any) => index(path, Org, params = params),

  show: (id?: string) => (id ? show(`${path}/${id}`, Org) : noData()),
  userCount: (id: string) => get(`${path}/${id}/user_count`),
};
