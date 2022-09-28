import { Org } from "../models";
import type { OrgParams as Params } from "../models";
import { create, get, index, noData, show, del } from "./common";
import useUser from "../lib/useUser";


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
