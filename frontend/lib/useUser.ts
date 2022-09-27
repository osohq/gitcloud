import { useEffect } from "react";
import Router from "next/router";
import useSWR from "swr";
import { User } from "../models/User";
import { get } from "../api/common";
import createPersistedState from "use-persisted-state";

export type CurrentUser =
  | {
    isLoggedIn: false;
  }
  | { isLoggedIn: true; user: User };

const createSessionState = createPersistedState<string>(
  "session"
);


export default function useUser({ redirectTo, redirectIfFound }: {
  // Set this to enable the redirect behaviour
  redirectTo?: string,
  // Set to true to redirect if the user is found
  // Defaults to false.
  redirectIfFound?: boolean,
} = { redirectIfFound: false }) {

  const [username, setUsername] = createSessionState("");

  const usernameSet = username !== "";

  const {
    data: user,
    mutate: mutateUser,
    error,
  } = useSWR<User>(usernameSet ? ["/session", username] : null, get);


  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !usernameSet) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !usernameSet) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && usernameSet)
    ) {
      Router.replace(redirectTo || `/users/${username}`);
    }
  }, [redirectIfFound, redirectTo, username, usernameSet]);

  let currentUser: { isLoggedIn: true, user: User } | { isLoggedIn: false } = { isLoggedIn: false };
  if (usernameSet && user) {
    currentUser = { isLoggedIn: true, user };
  }

  return { currentUser, setUsername, userId: username };
}
