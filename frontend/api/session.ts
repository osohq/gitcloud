import { User } from "../models";
import { create, del, get } from "./common";

type Params = { username: string };

const path = "/session";

export const session = {
  login: (body: Params) => create(path, body, User),

  logout: () => del(path, {}),

  whoami: () => get(path),
};
