import { Repo } from "../models";
import { create, index, noData, show } from "./common";

type Params = { name: string };

export function repo(orgId?: string) {
  const path = `/orgs/${orgId}/repos`;

  return {
    create: (body: Params) => create(path, body, Repo),

    index: () => orgId ? index(path, Repo) : noData(),

    show: (id?: string) => (orgId && id) ? show(`${path}/${id}`, Repo) : noData(),
  };
}
