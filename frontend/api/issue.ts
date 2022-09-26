import { Issue } from "../models";
import { create, index, noData, show, update } from "./common";

type Params = { title?: string, closed?: boolean };

export function issue(orgId?: string, repoId?: string) {
  const path = `/orgs/${orgId}/repos/${repoId}/issues`;
  const defined = orgId && repoId;

  return {
    create: (body: Params) => create(path, body, Issue),

    index: () => (defined ? index(path, Issue) : noData()),

    show: (id?: string) =>
      defined && id ? show(`${path}/${id}`, Issue) : noData(),

    update: (id: string, params: Params) => update(`${path}/${id}`, params, Issue),
  };
}
