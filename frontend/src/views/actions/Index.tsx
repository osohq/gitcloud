import { ChangeEvent, FormEvent, useContext, useEffect, useState } from "react";
import { Link, RouteComponentProps } from "@reach/router";
import { formatDistance } from "date-fns";

import { Action, Org, Repo, User, UserContext } from "../../models";
import { action as actionApi, org as orgApi, repo as repoApi } from "../../api";
import { NoticeContext } from "../../components";

type Props = RouteComponentProps & { orgId?: string; repoId?: string };

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

export function Index({ orgId, repoId }: Props) {
  const user = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [actions, setActions] = useState<Action[]>([]);
  const [name, setName] = useState<string>("");
  const { error } = useContext(NoticeContext);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [orgId, user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    repoApi(orgId)
      .show(repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [orgId, repoId, user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!(user.current instanceof User) || !orgId || !repoId) return;
    actionApi(user.current.id, orgId, repoId)
      .index()
      .then(setActions)
      .catch((e) => redirectWithError(`Failed to fetch actions: ${e.message}`));
  }, [refetch, orgId, repoId, user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setInterval(() => setRefetch((x) => !x), 2000);
    return () => clearInterval(timeout);
  }, []);

  if (!org || !repo) return null;

  const inputEmpty = !name.replaceAll(" ", "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty || !(user.current instanceof User) || !orgId || !repoId)
      return;
    try {
      await actionApi(user.current.id, orgId, repoId).create({
        name,
      });
      setName("");
      setRefetch((x) => !x);
    } catch (e) {
      error(`Failed to create new action: ${e.message}`);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setName(value);
  }

  return (
    <>
      <h1>
        <Link to={`/orgs/${org.id}`}>{org.name}</Link> /{" "}
        <Link to={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /
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
          </tr>
        </thead>

        <tbody>
          {actions.map((a) => (
            <tr className="" key={"action-" + a.id}>
              <td className="">{a.status}</td>
              <td className="">{a.name}</td>
              <td className="">{a.creatorId}</td>
              <td className="">
                {formatDistance(new Date(), new Date(a.createdAt))} ago
              </td>
              <td className="">
                <RunningTime a={a} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
