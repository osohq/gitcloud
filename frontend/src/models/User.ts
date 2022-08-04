import { createContext } from "react";

export type LoggedInUser = User | "Guest" | "Loading";

  const OSO_API = "http://localhost:8081/api/";

export class User {
  id: string;
  token: string;

  constructor({ id, token }: User) {
    this.id = id;
    this.token = token;
  }

  async oso(method: string, path: string) {
    const res = await fetch(OSO_API + path, {
      method: "GET",
      headers: new Headers({
        Authorization: `Bearer ${this.token}`,
      }),
    });
    return res.json();
  }

}

export const UserContext = createContext<{
  current: LoggedInUser;
  loggedIn: () => boolean;
  update: (u: LoggedInUser) => void;
}>({
  current: "Loading",
  loggedIn: () => false,
  update: (_) => console.error("override me"),
});
