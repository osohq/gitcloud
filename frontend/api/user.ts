import { Org, Repo, User } from "../models";
import { show, index, noData } from "./common";

const path = "/users";

export const user = {
  show: (id?: string) => (id ? show(`${path}/${id}`, User) : noData()),
  repos: (id?: string) => (id ? index(`${path}/${id}/repos`, Repo) : noData()),
  orgs: (id?: string) => (id ? index(`${path}/${id}/orgs`, Org) : noData()),
};
