import useUser from "../lib/useUser";
import { User } from "../models";
import { create, del, get } from "./common";

type Params = { username: string };

const path = "/session";

export function session() {
  const { userId } = useUser();

  return {

    login: (body: Params) => create(path + "/login", body, User, userId),
    logout: () => del(path + "/logout", {}, userId),
  }
};
