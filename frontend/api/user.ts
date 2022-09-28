import useUser from "../lib/useUser";
import { Org, Repo, User } from "../models";
import { show, index, noData } from "./common";

const path = "/users";

export function user() {
  const { userId } = useUser();
  return {
    show: (id?: string) => (id ? show(`${path}/${id}`, User, userId) : noData()),
    repos: (id?: string) => (id ? index(`${path}/${id}/repos`, Repo, userId) : noData()),
    orgs: (id?: string) => (id ? index(`${path}/${id}/orgs`, Org, userId) : noData()),
  }
};
