import { Dispatch, SetStateAction, useContext, useEffect } from "react";

import { RoleAssignment, User } from "../models";
import { RoleAssignmentsApi } from "../api";
import { NoticeContext, RoleSelector } from ".";
import Link from "next/link";
import useUser from "../lib/useUser";
import ErrorPage from "./ErrorMessage";
import LoadingPage from "./LoadingPage";

type Props = {
  api: RoleAssignmentsApi;
  assignments: RoleAssignment[];
  setAssignments: Dispatch<SetStateAction<RoleAssignment[]>>;
  roleChoices: string[];
  setRefetch: Dispatch<SetStateAction<boolean>>;
};

export function RoleAssignments({
  api,
  assignments,
  setAssignments,
  roleChoices,
  setRefetch,
}: Props) {
  const {
    currentUser: { isLoggedIn, user },
  } = useUser();

  const { data: users, isLoading, error } = api.index();
  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage error={error} />;

  function update(user: User, role: string) {
    api.update({ username: user.username, role }).then((next) => {
      const { username } = next.user;
      // NOTE(gj): Assumes a user has a single role per resource.
      setAssignments((as) =>
        as.map((a) => (a.user.username === username ? next : a))
      );
    });
    // .catch((e) => error(`Failed to update role assignment: ${e.message}`));
  }

  function remove({ user, role }: RoleAssignment) {
    api.delete({ username: user.username, role }).then(() => {
      // NOTE(gj): Assumes a user has a single role per resource.
      setAssignments((as) =>
        as.filter((a) => a.user.username !== user.username)
      );
      setRefetch((x) => !x);
    });
    // .catch((e) => error(`Failed to delete role assignment: ${e.message}`));
  }

  return (
    <ul>
      {assignments.map(({ user, role }) => (
        <li key={"user-role-" + user.username + role}>
          <Link
            href={`/users/${user.username}`}
          >{`${user.name} (${user.email})`}</Link>{" "}
          -{" "}
          <RoleSelector
            choices={roleChoices}
            update={({ target: { value } }) => update(user, value)}
            selected={role}
          />{" "}
          -{" "}
          <button
            disabled={!isLoggedIn}
            onClick={(e) => {
              e.preventDefault();
              remove({ user, role });
            }}
          >
            delete
          </button>
        </li>
      ))}
    </ul>
  );
}
