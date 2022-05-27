import { Action } from "../models";
import { create, index, update } from "./helpers";

type Params = { name: string };

export function action(userId: string, orgId: string, repoId: string) {
  const path = `/orgs/${orgId}/repos/${repoId}/actions`;

  return {
    create: (body: Params) => create(path, body, Action, userId),

    index: () => index(path, Action, userId),

    cancel: (id: string) => update(`${path}/${id}/cancel`, {}, Action, userId),
  };
}
