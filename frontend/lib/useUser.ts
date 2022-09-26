import { useEffect } from "react";
import Router from "next/router";
import useSWR from "swr";
import { User } from "../models/User";
import { get } from "../api/common";

export type CurrentUser =
  | {
    isLoggedIn: false;
  }
  | { isLoggedIn: true; user: User };

export default function useUser({ redirectTo, redirectIfFound }: {
  // Set this to enable the redirect behaviour
  redirectTo?: string,
  // Set to true to redirect if the user is found
  // Defaults to false.
  redirectIfFound?: boolean,
} = { redirectIfFound: false }) {
  const {
    data: user,
    mutate: mutateUser,
    error,
  } = useSWR<User>("/session", get);

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !user) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !user) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && user)
    ) {
      Router.replace(redirectTo || `/users/${user.username}`);
    }
  }, [user, redirectIfFound, redirectTo]);

  let currentUser;
  if (user) {
    currentUser = { isLoggedIn: true, user };
  } else {
    currentUser = { isLoggedIn: false };
  }

  return { currentUser, mutateUser };
}
