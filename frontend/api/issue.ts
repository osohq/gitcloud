import useUser from "../lib/useUser";
import { Issue } from "../models";
import { create, index, noData, show, update } from "./common";

type Params = { title?: string; closed?: boolean };

export function orgsReposIssue(orgId?: string, repoId?: string) {
  const path = `/issues/orgs/${orgId}/repos/${repoId}/issues`;
  const defined = orgId && repoId;
  const { userId } = useUser();

  return {
    create: (body: Params) => create(path, body, Issue, userId),

    index: () => (defined ? index(path, Issue, userId) : noData()),

    show: (id?: string) =>
      defined && id ? show(`${path}/${id}`, Issue, userId) : noData(),

    update: (id: string, params: Params) =>
      update(`${path}/${id}`, params, Issue, userId),
  };
}

export function issues(close: boolean) {
  const { userId } = useUser();
  let path = `/issues/`;
  if (close) {
    path += "?close";
  }
  return index(path, Issue, userId);
}
