import { createContext } from "react";

export type LoggedInUser = User | "Guest" | "Loading";

export class User {
  username: string;
  name: string;
  email: string;

  constructor({ username, name, email }: User) {
    this.username = username;
    this.email = email;
    this.name = name;
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
