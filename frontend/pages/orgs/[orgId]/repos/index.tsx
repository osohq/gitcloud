import { useContext, useEffect, useState } from "react";

import { Org, Repo } from "../../../../models";
import { org as orgApi, repo as repoApi } from "../../../../api";
import { NoticeContext } from "../../../../components";
import useUser from "../../../../lib/useUser";
import Link from 'next/link';

type Props = { orgId?: string };

export default function Index({ orgId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser({ redirectTo: "/login" });
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [orgId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId) return;
    repoApi(orgId)
      .index()
      .then(setRepos)
      .catch((e) => redirectWithError(`Failed to fetch repos: ${e.message}`));
  }, [orgId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!org) return null;

  const maybeNewLink = !isLoggedIn ? null : (
    <Link href={`/orgs/${orgId}/repos/new`}>Create new repo</Link>
  );

  return (
    <>
      <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> repos
      </h1>
      <ul>
        {repos.map((r) => (
          <li key={"repo-" + r.id}>
            <Link href={`/orgs/${org.id}/repos/${r.id}`}>{r.name}</Link>
          </li>
        ))}
      </ul>
      {maybeNewLink}
    </>
  );
}
