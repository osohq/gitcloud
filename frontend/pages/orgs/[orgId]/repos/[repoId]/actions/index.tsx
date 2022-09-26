import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { formatDistance } from "date-fns";

import Link from "next/link";
import { useRouter } from "next/router";
import { Action, User } from "../../../../../../models";
import {
  action as actionApi,
  org as orgApi,
  repo as repoApi,
} from "../../../../../../api";
import useUser from "../../../../../../lib/useUser";
import ErrorMessage from "../../../../../../components/ErrorMessage";
import LoadingPage from "../../../../../../components/LoadingPage";
import { index, noData } from "../../../../../../api/common";
import Breadcrumbs from "../../../../../../components/Breadcrumbs";

function runningTime(a: Action): number {
  const updatedAt =
    a.status === "complete" || a.status === "canceled"
      ? new Date(a.updatedAt).getTime()
      : Date.now();
  const createdAt = new Date(a.createdAt).getTime();
  return Math.round((updatedAt - createdAt) / 1000);
}

function RunningTime({ a }: { a: Action }) {
  const [time, setTime] = useState<number>(runningTime(a));

  useEffect(() => {
    if (a.status === "complete" || a.status === "canceled") return;
    const timeout = setInterval(() => setTime(runningTime(a)), 100);
    return () => clearInterval(timeout);
  }, [a]);

  return <span>{time}s</span>;
}

export default function Index() {
  const {
    currentUser: { user, isLoggedIn },
  } = useUser();
  const router = useRouter();
  const { orgId, repoId } = router.query as { orgId?: string; repoId?: string };
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = orgApi.show(orgId);
  const {
    data: repo,
    isLoading: repoLoading,
    error: repoError,
  } = repoApi(orgId).show(repoId);
  const {
    data: actions,
    error: actionError,
    mutate,
  } = orgId && repoId && user
      ? index(`/orgs/${orgId}/repos/${repoId}/actions`, Action, user.username, {
        refreshInterval: 2_000,
      })
      : noData();
  const [name, setName] = useState("");

  if (orgLoading || repoLoading || (!actions && !actionError))
    return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (actionError) return <ErrorMessage error={actionError} />;
  if (!user || !actions || !org || !repo) return null;

  const api = actionApi(user.username, orgId, repoId);
  const inputEmpty = !name.replaceAll(" ", "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty) return;
    try {
      await api.create({ name });
      setName("");
      mutate();
    } catch (e) {
      // error(`Failed to create new action: ${e}`);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setName(value);
  }

  return (
    <>
      <Breadcrumbs
        pages={
          [
            { name: org.name, href: { pathname: "/orgs/[orgId]", query: { orgId } } },
            { name: repo.name, href: { pathname: "/orgs/[orgId]/repos/[repoId]", query: { orgId, repoId }, current: true } },
          ]
        }
      />

      <form className="mt-8" onSubmit={handleSubmit}>
        <label>
          Schedule action:{" "}
          <input
            type="text"
            value={name}
            placeholder="name"
            onChange={handleChange}
          />
        </label>{" "}
        <input type="submit" value="schedule" disabled={inputEmpty} />
      </form>

      <br />

      {/* <table>
        <thead>
          <tr>
            <th style={{ width: "150px", textAlign: "start" }}>Status</th>
            <th style={{ width: "400px", textAlign: "start" }}>Name</th>
            <th style={{ width: "200px", textAlign: "start" }}>Actor</th>
            <th style={{ width: "200px", textAlign: "start" }}>Started</th>
            <th style={{ width: "100px", textAlign: "start" }}>Duration</th>
            <th style={{ width: "100px", textAlign: "start" }}></th>
          </tr>
        </thead>

        <tbody>
          {actions.map((a) => (
            <tr className="" key={"action-" + a.id}>
              <td>{a.status}</td>
              <td>{a.name}</td>
              <td>{a.creatorId}</td>
              <td>{formatDistance(new Date(), new Date(a.createdAt))} ago</td>
              <td>
                <RunningTime a={a} />
              </td>
              <td>
                <button
                  disabled={!a.cancelable}
                  onClick={(e) => {
                    e.preventDefault();
                    api.cancel(a.id);
                  }}
                >
                  cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Name
            </th>
            <th
              scope="col"
              className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900 "
            >
              Actor
            </th>
            <th scope="col" className="hidden lg:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Started
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Duration
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Status
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {actions.map((action) => (
            <tr key={action.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {action.name}
              </td>
              <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {action.creatorId}
              </td>
              <td className="hidden lg:table-cell  whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {formatDistance(new Date(), new Date(action.createdAt))} ago
              </td>
              <td className="hidden sm:table-cell  whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <RunningTime a={action} />
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{action.status}</td>
              <td className="whitespace-nowrap py-4 px-2 text-right text-sm font-medium sm:pr-6 w-16">
                {action.cancelable &&
                  <a href="#" onClick={(e) => { e.preventDefault(); api.cancel(action.id) }} className="text-red-600 hover:text-red-900">
                    Cancel<span className="sr-only">, {action.id}</span>
                  </a>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}