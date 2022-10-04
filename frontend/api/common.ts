import merge from "lodash.merge";
import useSWR from "swr";
import { obj, snakeifyKeys, camelizeKeys } from "../lib/helpers";

type Class<T extends {} = {}> = new (...args: any[]) => T;

export const ROUTER_ROOT =
  process.env.NEXT_PUBLIC_PRODUCTION == "1"
    ? "https://main--osohq-gitcloud.apollographos.net/graphql"
    : "http://localhost:4000";
const GITCLUB_ROOT =
  process.env.NEXT_PUBLIC_PRODUCTION == "1"
    ? "https://gitcloud-gitclub.fly.dev"
    : "http://localhost:5000";
const JOBS_ROOT =
  process.env.NEXT_PUBLIC_PRODUCTION == "1"
    ? "https://gitcloud-actions.fly.dev"
    : "http://localhost:5001";

const defaultOpts: RequestInit = {
  headers: {
    Accept: "application/json",
  },
  credentials: "include",
};


const jsonify = (x: obj) => JSON.stringify(snakeifyKeys(x));

async function req(path: string, expected: number, opts?: RequestInit) {
  const root = /^\/orgs\/\d+\/repos\/\d+\/jobs/.test(path)
    ? JOBS_ROOT
    : GITCLUB_ROOT;
  const res = await fetch(root + path, merge({}, defaultOpts, opts));
  if (res.status === expected) {
    if (expected !== 204) return res.json();
  } else throw new Error(await res.text() || res.statusText);
}

export const noData = () => {
  const _ = useSWR(null);
  return {
    data: undefined,
    isLoading: true,
    error: undefined,
    mutate: async () => undefined,
  };
};

export const get = (path: string, userId?: string) =>
  req(path, 200, userId ? { headers: { 'x-user-id': userId } } : {});

const patch = (path: string, body: obj, userId?: string) =>
  req(path, 200, {
    method: "PATCH",
    body: jsonify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
    }
  });

const post = (path: string, body: obj, userId?: string) =>
  req(path, 201, {
    method: "POST",
    body: jsonify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
    }
  });

export const del = (path: string, body: obj, userId?: string) =>
  req(path, 204, {
    method: "DELETE",
    body: jsonify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
    }
  });

export function index<T extends {}>(
  path: string,
  cls: Class<T>,
  userId?: string,
  params?: any
) {
  const { data, error, mutate } = useSWR<T[]>(
    path,
    (p) => get(p, userId),
    params
  );

  return {
    data: data ? data.map((d) => new cls(camelizeKeys(d))) : undefined,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export function show<T extends {}>(
  path: string,
  cls: Class<T>,
  userId?: string,
  params?: any
) {
  const { data, error, mutate } = useSWR<T>(
    path,
    (p) => get(p, userId),
    params
  );

  return {
    data: data ? new cls(camelizeKeys(data)) : undefined,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export async function create<T extends {}>(
  path: string,
  body: obj,
  cls: Class<T>,
  userId?: string
) {
  const data = (await post(path, body, userId)) as obj;
  return new cls(camelizeKeys(data));
}

export async function update<T extends {}>(
  path: string,
  body: obj,
  cls: Class<T>,
  userId?: string
) {
  const data = (await patch(path, body, userId)) as obj;
  return new cls(camelizeKeys(data));
}
