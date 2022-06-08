import { createContext } from "react";

export type LoggedInUser = User | "Guest" | "Loading";

export class User {
  id: string;

  constructor({ id }: User) {
    this.id = id;
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
