import useUser from "../lib/useUser";
import { get } from "./common";

const org = () => {
  return get(`/accounts/org_role_choices`) as Promise<string[]>;
};

const repo = () => {
  return get(`/accounts/repo_role_choices`) as Promise<string[]>;
};

export const roleChoices = { org, repo };
