import { useContext, useEffect, useState } from "react";

import { Issue, Org, Repo } from "../../../../../../models";
import {
  issue as issueApi,
  org as orgApi,
  repo as repoApi,
} from "../../../../../../api";
import { NoticeContext } from "../../../../../../components";
import useUser from "../../../../../../lib/useUser";
import Link from "next/link";
import { useRouter } from "next/router";
import ErrorMessage from "../../../../../../components/ErrorMessage";
import LoadingPage from "../../../../../../components/LoadingPage";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Breadcrumbs from "../../../../../../components/Breadcrumbs";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Show() {
  const {
    currentUser: { user },
  } = useUser();
  const router = useRouter();
  const [error, setError] = useState<Error | undefined>(undefined);
  const { orgId, repoId, issueId } = router.query as {
    orgId?: string;
    repoId?: string;
    issueId?: string;
  };
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
    data: issue,
    isLoading: issueLoading,
    error: issueError,
    mutate: setIssue,
  } = issueApi(orgId, repoId).show(issueId);

  if (orgLoading || repoLoading || issueLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (issueError) return <ErrorMessage error={issueError} />;
  if (error) return <ErrorMessage setError={setError} error={error} />;
  if (!issue || !issueId || !org || !repo) return null;

  function updateIssue(params: any) {
    issueApi(orgId, repoId).update(issueId!, params).then(issue => setIssue(issue)).catch(setError)
  }

  return (
    <>
      <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div className="ml-4 mt-2">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex-1 w-128">
              <Breadcrumbs
                pages={
                  [
                    { name: org.name, href: { pathname: "/orgs/[orgId]", query: { orgId } } },
                    { name: repo.name, href: { pathname: "/orgs/[orgId]/repos/[repoId]", query: { orgId, repoId }, current: true } },
                  ]
                }
              />
              <h3 className="flex row mt-2 text-xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight sm:truncate">
                Issue #{issue.issueNumber}
                <div className="ml-2 flex-shrink-0 flex px-2 inline-flex font-semibold px-2 inline-flex font-semibold ">
                  {issue.closed ?
                    <p className="rounded-full bg-purple-100 text-purple-800">
                      Closed
                    </p> : <p className="rounded-full bg-green-100 text-green-800">
                      Open
                    </p>
                  }
                </div>
              </h3>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <form action="#" className="relative">
          <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              className="block w-full border-0 pt-2.5 text-lg font-medium placeholder-gray-500 focus:ring-0"
              disabled
              value={issue.title}
            />
            <label htmlFor="description" className="sr-only">
              Description
            </label>
            <textarea
              rows={2}
              name="description"
              id="description"
              className="block w-full resize-none border-0 py-0 placeholder-gray-500 focus:ring-0 sm:text-sm"
              placeholder="Write a description..."
              defaultValue={'A description of the issue'}
              disabled
            />

            {/* Spacer element to match the height of the toolbar */}
            <div aria-hidden="true">
              <div className="py-2">
                <div className="h-9" />
              </div>
              <div className="h-px" />
              <div className="py-2">
                <div className="py-px">
                  <div className="h-9" />
                </div>
              </div>
            </div>
          </div>
        </form>
        <div className="mt-4">
          <button
            type="button"
            className={
              classNames(
                repo.permissions?.includes("manage_issues") ?
                  "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" :
                  "bg-gray-400"
                ,
                "relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white "
              )
            }
            disabled={!repo.permissions?.includes("manage_issues")}
            onClick={(e) => {
              e.preventDefault();
              updateIssue({ closed: !issue.closed })
            }}
          >
            {issue.closed ? "Re-open issue" : "Close issue"}
          </button>
        </div>
      </div>
    </>
  );
}
