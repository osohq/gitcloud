import { useContext, useEffect, useState } from "react";

import { Issue, Org, Repo } from "../../../../../../models";
import { issue as issueApi, org as orgApi, repo as repoApi } from "../../../../../../api";
import { NoticeContext } from "../../../../../../components";
import useUser from "../../../../../../lib/useUser";
import Link from 'next/link';
import { useRouter } from "next/router";
import ErrorMessage from "../../../../../../components/ErrorMessage";
import LoadingPage from "../../../../../../components/LoadingPage";

export default function Show() {
  const { currentUser: { user } } = useUser();
  const router = useRouter()
  const { orgId, repoId, issueId } = router.query as { orgId?: string, repoId?: string, issueId?: string };
  const { data: org, isLoading: orgLoading, error: orgError } = orgApi.show(orgId);
  const { data: repo, isLoading: repoLoading, error: repoError } = repoApi(orgId).show(repoId);
  const { data: issue, isLoading: issueLoading, error: issueError } = issueApi(orgId, repoId).show(issueId);

  if (orgLoading || repoLoading || issueLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (issueError) return <ErrorMessage error={issueError} />;
  if (!issue || !org || !repo) return null;

  return (
    <>
      {/* <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}/issues`}>issues</Link> /{" "}
        {issue.id}
      </h1> */}
      <h2>{issue.title}</h2>
    </>
  );
}
