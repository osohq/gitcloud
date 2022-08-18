import Link from 'next/link';
import { useRouter } from 'next/router';
import { org as orgApi, repo as repoApi, issue as issueApi } from "../../../../api";
import useUser from "../../../../lib/useUser";
import LoadingPage from "../../../../components/LoadingPage";
import { IssueList } from "../../../../components/IssueList";
import ErrorMessage from "../../../../components/ErrorMessage";


export default function Show() {
  const router = useRouter()
  const { orgId, repoId } = router.query as { orgId: string, repoId: string };
  const { data: org, isLoading: orgLoading, error: orgError } = orgApi.show(orgId);
  const { data: repo, isLoading: repoLoading, error: repoError } = repoApi(orgId).show(repoId);
  const { data: issues, isLoading: issueLoading, error: issueError } = issueApi(orgId, repoId).index();


  if (orgLoading || repoLoading || issueLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (issueError) return <ErrorMessage error={issueError} />;

  if (!org || !repo || !issues) return;

  Show.title = `${repo.name}`;

  return (
    <>
      <IssueList orgId={orgId} repoId={repoId} issues={issues} />
    </>
  );
}

Show.title = "Repository";
