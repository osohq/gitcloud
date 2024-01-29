import useUser from "../lib/useUser";
import { Job } from "../models";
import { create, index, noData, update } from "./common";

type Params = { name: string };

export function job(orgId?: string, repoId?: string) {
  const path = `/jobs/orgs/${orgId}/repos/${repoId}/jobs`;
  const defined = orgId && repoId;
  const { userId } = useUser();

  return {
    create: (body: Params) => create(path, body, Job, userId),

    index: () => (defined ? index(path, Job, userId) : noData()),

    cancel: (id: number) => update(`${path}/${id}/cancel`, {}, Job, userId),
  };
}
