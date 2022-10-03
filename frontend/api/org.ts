import { Org } from "../models";
import type { OrgParams as Params } from "../models";
import { create, get, index, noData, show, del } from "./common";
import useUser from "../lib/useUser";
import { gql, useQuery, useMutation } from '@apollo/client';

export function org() {
  const path = `/orgs`;
  const { userId } = useUser();

  return {

    create: (body: Params) => create(path, body, Org, userId),

    index: (params?: any) => index(path, Org, userId, params),

    show: (id?: string) => (id ? show(`${path}/${id}`, Org, userId) : noData()),
    del: (id: string) => del(`${path}/${id}`, {}, userId),
    userCount: (id?: string) => (id ? get(`${path}/${id}/user_count`, userId) : noData()),
  }
};

export const GET_ORGS = gql`
  query GetOrgs {
    orgs {
      id
      name
      billingAddress
      repositoryCount
      userCount
      permissions
      role
    }
  }
`;

export function useOrgs() {
  const { data, loading, error } = useQuery(GET_ORGS);
  return {
    orgs: data?.orgs,
    isLoading: loading,
    error,
  };
}

export const GET_ORG = gql`
  query GetOrg($id: ID!) {
    org(id: $id) {
      id
      name
      billingAddress
      repositoryCount
      userCount
      permissions
      role
    }
  }
`;


export function useOrg(id?: string) {
  const { data, loading, error } = useQuery(GET_ORG, {
    variables: { id },
  });
  return {
    org: data?.org,
    isLoading: loading,
    error,
  };
}


const DELETE_ORG = gql`
  mutation DeleteOrg($id: ID!) {
    deleteOrg(id: $id) {
      id
    }
  }
`;

export function useDeleteOrg() {
  const [deleteOrg, { data, loading, error }] = useMutation(DELETE_ORG);
  return {
    deleteOrg: (id: string) => deleteOrg({ variables: { id } }),
    org: data?.deleteOrg,
    isLoading: loading,
    error,
  };
}

