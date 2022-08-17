import { useContext, useEffect, useState } from "react";

import { Issue, Org, Repo } from "../../../../../../models";
import { issue as issueApi, org as orgApi, repo as repoApi } from "../../../../../../api";
import { NoticeContext } from "../../../../../../components";
import useUser from "../../../../../../lib/useUser";
import Link from 'next/link';

type Props = { orgId?: string; repoId?: string };

export default function Index({ orgId, repoId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [issues, setIssues] = useState<Issue[]>();

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [orgId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    repoApi(orgId)
      .show(repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [orgId, repoId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    issueApi(orgId, repoId)
      .index()
      .then(setIssues)
      .catch((e) => redirectWithError(`Failed to fetch issues: ${e.message}`));
  }, [orgId, repoId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!org || !repo || !issues) return null;

  const maybeNewLink = !isLoggedIn ? null : (
    <Link href={`/orgs/${orgId}/repos/${repoId}/issues/new`}>
      Create new issue
    </Link>
  );

  return (
    <>
      <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /
        issues
      </h1>
      <ul>
        {issues.map((i) => (
          <li key={"issue-" + i.id}>
            <Link href={`/orgs/${org.id}/repos/${repo.id}/issues/${i.id}`}>
              #{i.id} - {i.title}
            </Link>
          </li>
        ))}
      </ul>
      {maybeNewLink}
    </>
  );
}
