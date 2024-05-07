import useUser from "../lib/useUser";
import { Org, Repo, User } from "../models";
import { show, index, noData } from "./common";

const path = "/accounts/users";

export function user() {
  const { userId } = useUser();
  return {
    show: (id?: number) =>
      id ? show(`${path}/${id}`, User, userId) : noData(),
    repos: (id?: number) =>
      id ? index(`${path}/${id}/repos`, Repo, userId) : noData(),
    orgs: (id?: number) =>
      id ? index(`${path}/${id}/orgs`, Org, userId) : noData(),
  };
}
