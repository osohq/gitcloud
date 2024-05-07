import Link from "next/link";
import { useRouter } from "next/router";
import {
  org as orgApi,
  repo as repoApi,
  orgsReposIssue as issueApi,
} from "../../../../api";
import useUser from "../../../../lib/useUser";
import LoadingPage from "../../../../components/LoadingPage";
import { IssueList } from "../../../../components/IssueList";
import ErrorMessage from "../../../../components/ErrorMessage";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "../../../../components/Breadcrumbs";

export default function Show() {
  const router = useRouter();
  const { orgId, repoId } = router.query as { orgId?: string; repoId?: string };
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = orgApi().show(orgId);
  const {
    data: repo,
    isLoading: repoLoading,
    error: repoError,
  } = repoApi(orgId).show(repoId);
  const {
    data: issues,
    isLoading: issueLoading,
    error: issueError,
  } = issueApi(orgId, repoId).index();

  if (orgLoading || repoLoading || issueLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (issueError) return <ErrorMessage error={issueError} />;

  if (!org || !repo || !issues) return;

  Show.title = `${repo.name}`;

  return (
    <>
      <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div className="ml-4">
          <Breadcrumbs
            pages={[
              {
                name: org.name,
                href: { pathname: "/orgs/[orgId]", query: { orgId } },
              },
            ]}
          />
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex-1 w-full">
              <h2 className="flex row mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight sm:truncate">
                {repo.name}
              </h2>
            </div>
          </div>
        </div>
        <div className="ml-4 mt-12 flex-shrink-0">
          {repo.permissions?.includes("view_members") && (
            <Link
              href={{
                pathname: "/orgs/[orgId]/repos/[repoId]/settings",
                query: { orgId, repoId },
              }}
            >
              <button
                type="button"
                className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Settings
              </button>
            </Link>
          )}
        </div>
      </div>
      {repo.permissions?.includes("read_jobs") && (
        <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
            <div className="ml-4 mt-2">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Jobs
              </h3>
            </div>

            <div className="ml-4 mt-2 flex-shrink-0">
              <Link
                href={{
                  pathname: "/orgs/[orgId]/repos/[repoId]/jobs",
                  query: { orgId, repoId },
                }}
              >
                <button
                  type="button"
                  className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Jobs
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Issues
            </h3>
          </div>
          <div className="ml-4 mt-2 flex-shrink-0">
            {repo.permissions?.includes("create_issues") && (
              <Link
                href={{
                  pathname: "/orgs/[orgId]/repos/[repoId]/issues/new",
                  query: { orgId, repoId },
                }}
              >
                <button
                  type="button"
                  className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create new issue
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
      <IssueList issues={issues} />
    </>
  );
}

Show.title = "Repository";
