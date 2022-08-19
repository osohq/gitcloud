import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import { RoleAssignment, RoleAssignmentParams, User } from "../models";
import type { RoleAssignmentsApi } from "../api";
import { NoticeContext, RoleSelector } from ".";
import useUser from "../lib/useUser";
import LoadingPage from "./LoadingPage";
import ErrorPage from "./ErrorMessage";

type Props = {
  api: RoleAssignmentsApi;
  setAssignments: Dispatch<SetStateAction<RoleAssignment[]>>;
  roleChoices: string[];
  setRefetch: Dispatch<SetStateAction<boolean>>;
  refetch: boolean;
};

export function NewRoleAssignment({
  api,
  setAssignments,
  roleChoices,
  refetch,
  setRefetch,
}: Props) {
  const {
    currentUser: { user: u, isLoggedIn },
  } = useUser();
  const [details, setDetails] = useState<RoleAssignmentParams>({
    username: "",
    role: roleChoices[0],
  });

  const { data: users, isLoading, error } = api.index();
  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorPage error={error} />;

  if (!isLoggedIn || !users) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const assignment = await api.create(details);
      setRefetch((x) => !x);
      setDetails((details) => ({ ...details, userId: "" }));
      setAssignments((assignments) => [...assignments, { ...assignment }]);
    } catch (e) {
      // error(`Failed to create new role assignment: ${e}`);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLSelectElement>) {
    setDetails((details) => ({ ...details, [name]: value }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        user:{" "}
        <select
          name="username"
          value={details.username}
          onChange={handleChange}
        >
          {users.map((u) => (
            <option key={u.user.username} value={u.user.username}>
              {u.user.username}
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        role:{" "}
        <RoleSelector
          choices={roleChoices}
          selected={details.role}
          update={handleChange}
        />
      </label>{" "}
      <input type="submit" value="assign" />
    </form>
  );
}
