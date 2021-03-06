import merge from "lodash.merge";

import { camelizeKeys, obj, snakeifyKeys } from "../helpers";

type Class<T extends {} = {}> = new (...args: any[]) => T;

const GITCLUB_ROOT = "http://localhost:5000";
const ACTIONS_ROOT = "http://localhost:5001";

const defaultOpts: RequestInit = {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  credentials: "include",
};

const jsonify = (x: obj) => JSON.stringify(snakeifyKeys(x));

async function req(path: string, expected: number, opts?: RequestInit) {
  const root = /^\/orgs\/\d+\/repos\/\d+\/actions/.test(path)
    ? ACTIONS_ROOT
    : GITCLUB_ROOT;
  const res = await fetch(root + path, merge({}, defaultOpts, opts));
  if (res.status === expected) {
    if (expected !== 204) return res.json();
  } else throw new Error(res.statusText);
}

export const get = (path: string, userId?: string) =>
  req(path, 200, userId ? { headers: { USER: userId } } : {});

const patch = (path: string, body: obj, userId?: string) =>
  req(path, 200, {
    method: "PATCH",
    body: jsonify(body),
    headers: userId ? { USER: userId } : [],
  });

const post = (path: string, body: obj, userId?: string) =>
  req(path, 201, {
    method: "POST",
    body: jsonify(body),
    headers: userId ? { USER: userId } : [],
  });

export const del = (path: string, body: obj, userId?: string) =>
  req(path, 204, {
    method: "DELETE",
    body: jsonify(body),
    headers: userId ? { USER: userId } : [],
  });

export async function index<T>(path: string, cls: Class<T>, userId?: string) {
  const data = (await get(path, userId)) as obj[];
  return data.map((d) => new cls(camelizeKeys(d)));
}

export async function show<T>(path: string, cls: Class<T>, userId?: string) {
  const data = (await get(path, userId)) as obj;
  return new cls(camelizeKeys(data));
}

export async function create<T>(
  path: string,
  body: obj,
  cls: Class<T>,
  userId?: string
) {
  const data = (await post(path, body, userId)) as obj;
  return new cls(camelizeKeys(data));
}

export async function update<T>(
  path: string,
  body: obj,
  cls: Class<T>,
  userId?: string
) {
  const data = (await patch(path, body, userId)) as obj;
  return new cls(camelizeKeys(data));
}
