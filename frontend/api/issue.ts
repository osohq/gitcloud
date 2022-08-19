import { Issue } from "../models";
import { create, index, noData, show } from "./common";

type Params = { title: string };

export function issue(orgId?: string, repoId?: string) {
  const path = `/orgs/${orgId}/repos/${repoId}/issues`;
  const defined = orgId && repoId;

  return {
    create: (body: Params) => create(path, body, Issue),

    index: () => (defined ? index(path, Issue) : noData()),

    show: (id?: string) =>
      defined && id ? show(`${path}/${id}`, Issue) : noData(),
  };
}
