import { useContext, useEffect, useState } from "react";

import { Org, Repo, RoleAssignment } from "../../models";
import {
  org as orgApi,
  repo as repoApi,
  roleAssignments as roleAssignmentsApi,
  roleChoices as roleChoicesApi,
} from "../../api";
import {
  NewRoleAssignment,
  NoticeContext,
  RoleAssignments,
} from "../../components";
import useUser from "../../lib/useUser";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarIcon, LocationMarkerIcon, UsersIcon } from '@heroicons/react/solid'

export default function Show() {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const router = useRouter()
  const { orgId } = router.query as { orgId: string };
  const { error, redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repos, setRepos] = useState<Repo[]>();
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    orgApi.show(orgId).then(setOrg).catch(redirectWithError);
  }, [user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId) return;
    repoApi(orgId).index().then(setRepos).catch(redirectWithError);
  }, [user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    roleChoicesApi
      .org()
      .then(setRoleChoices)
      .catch((e) => error(`Failed to fetch org role choices: ${e.message}`));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orgId || !org) return null;

  const api = roleAssignmentsApi.org(orgId);

  // return (
  //   <>
  //     <h1>{org.name}</h1>
  //     <h4>Billing Address: {org.billingAddress}</h4>
  //     <h4>Base Repo Role: {org.baseRepoRole}</h4>

  //     <h2>
  //       <Link href={`/ orgs / ${orgId} / repos`}>Repos</Link>
  //     </h2>

  //     <h2>People</h2>

  //     <RoleAssignments
  //       api={api}
  //       assignments={roleAssignments}
  //       roleChoices={roleChoices}
  //       setAssignments={setRoleAssignments}
  //       setRefetch={setRefetch}
  //     />

  //     <h3>Invite new members</h3>

  //     {roleChoices.length && (
  //       <NewRoleAssignment
  //         api={api}
  //         refetch={refetch}
  //         roleChoices={roleChoices}
  //         setAssignments={setRoleAssignments}
  //         setRefetch={setRefetch}
  //       />
  //     )}
  //   </>
  // );
  return (
    <>
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight sm:truncate">
            {org.name}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <LocationMarkerIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
              {org.billingAddress}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Repositories</h3>
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

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {repos?.map((repo) => (
            <li key={repo.id}>
              <Link href={`/orgs/${orgId}/repos/${repo.id}`}>
                <a className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">{repo.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Foo
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <UsersIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Bar
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <LocationMarkerIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Qux
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <p>
                          {/* Closing on <time dateTime={repo.closeDate}>{repo.closeDateFull}</time> */}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

Show.title = "Organizations";

