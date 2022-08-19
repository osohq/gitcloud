import { useEffect, useState } from "react";
import {
  org as orgApi,
  repo as repoApi,
  roleAssignments as roleAssignmentsApi,
  roleChoices as roleChoicesApi,
} from "../../api";
import useUser from "../../lib/useUser";
import { useRouter } from "next/router";
import { LocationMarkerIcon } from "@heroicons/react/solid";
import { RepositoryList } from "../../components/RepositoryList";
import LoadingPage from "../../components/LoadingPage";
import ErrorMessage from "../../components/ErrorMessage";

export default function Show() {
  const {
    currentUser: { user, isLoggedIn },
  } = useUser();
  const router = useRouter();
  const { orgId } = router.query as { orgId?: string };

  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = orgApi.show(orgId);
  const {
    data: repos,
    isLoading: repoLoading,
    error: repoError,
  } = repoApi(orgId).index();
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  useEffect(() => {
    roleChoicesApi.org().then(setRoleChoices);
    // .catch((e) => error(`Failed to fetch org role choices: ${e.message}`));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (orgLoading || repoLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;

  if (!orgId || !org) return null;

  Show.title = `Organization: ${org.name}`;

  const api = roleAssignmentsApi.org(orgId);
  return (
    <>
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight sm:truncate">
            {org.name}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <LocationMarkerIcon
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              {org.billingAddress}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Repositories
            </h3>
          </div>
          <div className="ml-4 mt-2 flex-shrink-0">
            <button
              type="button"
              className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create new repository
            </button>
          </div>
        </div>
      </div>

      <RepositoryList repositories={repos || []} />
    </>
  );
}

Show.title = "Organizations";
