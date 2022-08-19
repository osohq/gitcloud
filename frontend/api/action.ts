import { Action } from "../models";
import { create, index, noData, update } from "./common";

type Params = { name: string };

export function action(userId?: string, orgId?: string, repoId?: string) {
  const path = `/orgs/${orgId}/repos/${repoId}/actions`;
  const defined = orgId && repoId && userId;

  return {
    create: (body: Params) => create(path, body, Action, userId),

    index: () => defined ? index(path, Action, userId) : noData(),

    cancel: (id: number) => update(`${path}/${id}/cancel`, {}, Action, userId),
  };
}
