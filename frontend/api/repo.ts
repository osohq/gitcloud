import useUser from "../lib/useUser";
import { Repo } from "../models";
import { create, index, noData, show, del } from "./common";

type Params = { name: string };

export function repo(orgId?: string) {
  const { userId } = useUser();

  const path = `/orgs/${orgId}/repos`;

  return {
    create: (body: Params) => create(path, body, Repo, userId),

    index: () => (orgId ? index(path, Repo, userId) : noData()),
    del: (id: string) => del(`${path}/${id}`, {}, userId),

    show: (id?: string) =>
      orgId && id ? show(`${path}/${id}`, Repo, userId) : noData(),
  };
}
