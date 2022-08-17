import { useContext, useEffect, useState } from "react";

import { Issue, Org, Repo } from "../../../../../../models";
import { issue as issueApi, org as orgApi, repo as repoApi } from "../../../../../../api";
import { NoticeContext } from "../../../../../../components";
import useUser from "../../../../../../lib/useUser";
import Link from 'next/link';

type Props = {
  issueId?: string;
  orgId?: string;
  repoId?: string;
};

export default function Show({ issueId, orgId, repoId }: Props) {
  const { currentUser: { user } } = useUser();
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [issue, setIssue] = useState<Issue>();

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    repoApi(orgId)
      .show(repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [user, orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId || !issueId) return;
    issueApi(orgId, repoId)
      .show(issueId)
      .then(setIssue)
      .catch((e) => redirectWithError(`Failed to fetch issue: ${e.message}`));
  }, [user, issueId, orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!issue || !org || !repo) return null;

  return (
    <>
      <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}/issues`}>issues</Link> /{" "}
        {issue.id}
      </h1>
      <h2>{issue.title}</h2>
    </>
  );
}
