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

const createSessionState = createPersistedState<User | null>("session");

export default function useUser(
  {
    redirectTo,
    redirectIfFound,
  }: {
    // Set this to enable the redirect behaviour
    redirectTo?: string;
    // Set to true to redirect if the user is found
    // Defaults to false.
    redirectIfFound?: boolean;
  } = { redirectIfFound: false }
) {
  const [user, setUser] = createSessionState(null);

  const userIsSet = user !== null;

  const {
    data: userData,
    mutate: mutateUser,
    error,
  } = useSWR<User>(userIsSet ? ["/accounts/session", user.id] : null, get);

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !userIsSet) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !userIsSet) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && userIsSet)
    ) {
      Router.replace(redirectTo || `/users/${user.id}`);
    }
  }, [redirectIfFound, redirectTo, user?.id, userIsSet]);

  let currentUser: { isLoggedIn: true; user: User } | { isLoggedIn: false } = {
    isLoggedIn: false,
  };
  if (userIsSet && userData) {
    currentUser = { isLoggedIn: true, user: userData };
  }

  return { currentUser, setUser, userId: user?.id };
}
