import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { formatDistance } from "date-fns";

import { Action, Org, Repo, User } from "../../models";
import { action as actionApi, org as orgApi, repo as repoApi } from "../../api";
import useUser from "../../lib/useUser";
import Link from 'next/link';
import error from "next/error";
import { useRouter } from "next/router";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingPage from "../../components/LoadingPage";
import useSWR from "swr";
import { index } from "../../api/common";

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
  const { currentUser: { user } } = useUser();
  const router = useRouter()
  const { orgId, repoId } = router.query as { orgId: string, repoId: string, issueId: string };
  const { data: org, isLoading: orgLoading, error: orgError } = orgApi.show(orgId);
  const { data: repo, isLoading: repoLoading, error: repoError } = repoApi(orgId).show(repoId);
  const { data: actions, error: actionError, mutate } = index(`/orgs/${orgId}/repos/${repoId}/actions`, Action, user?.username || "", { refreshInterval: 2000 })
  const [name, setName] = useState("");

  if (orgLoading || repoLoading || (!actions && !actionError)) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (actionError) return <ErrorMessage error={actionError} />;
  if (!user || !actions || !org || !repo) return null;

  if (!(user instanceof User) || !org || !repo) return null;
  const api = actionApi(user.username, "" + org.id, "" + repo.id);
  const inputEmpty = !name.replaceAll(" ", "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty) return;
    try {
      await api.create({ name });
      setName("");
      mutate()
    } catch (e) {
      // error(`Failed to create new action: ${e}`);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setName(value);
  }

  return (
    <>
      <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /
        actions
      </h1>

      <form onSubmit={handleSubmit}>
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

      <table>
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
      </table>
    </>
  );
}
