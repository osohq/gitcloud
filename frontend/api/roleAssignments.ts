import { User, RoleAssignment } from "../models";
import type { RoleAssignmentParams as Params } from "../models";
import { create, del, index, noData, update } from "./common";
import useSWR, { KeyedMutator } from "swr";
import useUser from "../lib/useUser";

export type RoleAssignmentsApi = {
  create: (body: Params) => Promise<RoleAssignment>;
  delete: (body: Params) => Promise<RoleAssignment>;
  index: () => {
    data: RoleAssignment[] | undefined;
    isLoading: boolean;
    error: Error | undefined;
    mutate: KeyedMutator<RoleAssignment[]>;
  };
  update: (body: Params) => Promise<RoleAssignment>;
  unassignedUsers: () => {
    data: User[] | undefined;
    isLoading: boolean;
    error: Error | undefined;
  };
};

function org(id?: string): RoleAssignmentsApi {
  const roleAssignments = `/orgs/${id}/role_assignments`;
  const unassignedUsers = `/orgs/${id}/unassigned_users`;
  const { userId } = useUser();

  return {
    create: (body: Params) =>
      create(roleAssignments, body, RoleAssignment, userId),

    delete: (body: Params) => del(roleAssignments, body, userId),

    index: () =>
      id ? index(roleAssignments, RoleAssignment, userId) : noData(),

    update: (body: Params) =>
      update(roleAssignments, body, RoleAssignment, userId),

    unassignedUsers: () =>
      id ? index(unassignedUsers, User, userId) : noData(),
  };
}

function repo(orgId?: string, repoId?: string): RoleAssignmentsApi {
  const roleAssignments = `/accounts/orgs/${orgId}/repos/${repoId}/role_assignments`;
  const unassignedUsers = `/accounts/orgs/${orgId}/repos/${repoId}/unassigned_users`;
  const defined = orgId && repoId;
  const { userId } = useUser();

  return {
    create: (body: Params) =>
      create(roleAssignments, body, RoleAssignment, userId),

    delete: (body: Params) => del(roleAssignments, body, userId),

    index: () =>
      defined ? index(roleAssignments, RoleAssignment, userId) : noData(),

    update: (body: Params) =>
      update(roleAssignments, body, RoleAssignment, userId),

    unassignedUsers: () =>
      defined ? index(unassignedUsers, User, userId) : noData(),
  };
}

export const roleAssignments = { org, repo };
