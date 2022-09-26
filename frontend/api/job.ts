import { Job } from "../models";
import { create, index, noData, update } from "./common";

type Params = { name: string };

export function job(orgId?: string, repoId?: string) {
  const path = `/orgs/${orgId}/repos/${repoId}/jobs`;
  const defined = orgId && repoId;

  return {
    create: (body: Params) => create(path, body, Job),

    index: () => (defined ? index(path, Job) : noData()),

    cancel: (id: number) => update(`${path}/${id}/cancel`, {}, Job),
  };
}
