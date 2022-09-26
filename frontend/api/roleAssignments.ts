import { User, RoleAssignment } from "../models";
import type { RoleAssignmentParams as Params } from "../models";
import { create, del, index, noData, update } from "./common";
import useSWR, { KeyedMutator } from "swr";

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

  return {
    create: (body: Params) => create(roleAssignments, body, RoleAssignment),

    delete: (body: Params) => del(roleAssignments, body),

    index: () => (id ? index(roleAssignments, RoleAssignment) : noData()),

    update: (body: Params) => update(roleAssignments, body, RoleAssignment),

    unassignedUsers: () => (id ? index(unassignedUsers, User) : noData()),
  };
}

function repo(orgId?: string, repoId?: string): RoleAssignmentsApi {
  const roleAssignments = `/orgs/${orgId}/repos/${repoId}/role_assignments`;
  const unassignedUsers = `/orgs/${orgId}/repos/${repoId}/unassigned_users`;
  const defined = orgId && repoId;

  return {
    create: (body: Params) => create(roleAssignments, body, RoleAssignment),

    delete: (body: Params) => del(roleAssignments, body),

    index: () => (defined ? index(roleAssignments, RoleAssignment) : noData()),

    update: (body: Params) => update(roleAssignments, body, RoleAssignment),

    unassignedUsers: () => (defined ? index(unassignedUsers, User) : noData()),
  };
}

export const roleAssignments = { org, repo };
