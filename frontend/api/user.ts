import { Org, Repo, User } from "../models";
import { show, index } from "./common";

const path = "/users";

export const user = {
  show: (id: string) => show(`${path}/${id}`, User),
  repos: (id: string) => index(`${path}/${id}/repos`, Repo),
  orgs: (id: string) => index(`${path}/${id}/orgs`, Org),
};
