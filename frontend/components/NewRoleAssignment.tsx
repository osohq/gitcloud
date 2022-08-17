import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  RoleAssignment,
  RoleAssignmentParams,
  User,
} from "../models";
import type { RoleAssignmentsApi } from "../api";
import { NoticeContext, RoleSelector } from ".";
import useUser from "../lib/useUser";

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
  const { currentUser } = useUser();
  const { error } = useContext(NoticeContext);
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<RoleAssignmentParams>({
    username: "",
    role: roleChoices[0],
  });

  useEffect(() => {
    if (currentUser.isLoggedIn) {
      api
        .unassignedUsers()
        .then((users) => {
          setUsers(users);
          setDetails((ds) => ({ ...ds, username: users[0] ? users[0].username : "" }));
        })
        .catch((e) => error(`Failed to fetch unassigned users: ${e.message}`));
    }
  }, [refetch, currentUser.user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentUser.isLoggedIn || !users.length) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const assignment = await api.create(details);
      setRefetch((x) => !x);
      setDetails((details) => ({ ...details, userId: "" }));
      setAssignments((assignments) => [...assignments, { ...assignment }]);
    } catch (e) {
      error(`Failed to create new role assignment: ${e}`);
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
        <select name="username" value={details.username} onChange={handleChange}>
          {users.map((u) => (
            <option key={u.username} value={u.username}>
              {u.username}
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
