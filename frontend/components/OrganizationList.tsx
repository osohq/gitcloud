import {
  UsersIcon,
  CalendarIcon,
  FolderOpenIcon,
} from "@heroicons/react/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Org } from "../models/Org";
import { org as orgApi } from "../api/org";

export function OrganizationList({ organizations }: { organizations: Org[] }) {
  const [orgs, setOrgs] = useState<Org[]>(organizations)

  useEffect(() => {
    const updateOrgs = async () => {
      let counts: { id: number, userCount: number }[] = []
      for (const org of orgs) {
        const userCount = await orgApi.userCount("" + org.id);
        setOrgs((orgs) => orgs.map(item => item.id == org.id ? ({ ...item, userCount }) : item))
      }
    }
    if (orgs) {
      updateOrgs()
    }
  }, [organizations]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {orgs.map((org) => (
          <li key={org.id}>
            <Link href={`/orgs/${org.id}`}>
              <a className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {org.name}
                    </p>
                    {/* <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Foo
                      </p>
                    </div> */}
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <UsersIcon
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                        {org.userCount !== undefined ? org.userCount : "-"}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <FolderOpenIcon
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                        {org.repositoryCount}
                      </p>
                    </div>
                    {/* <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <CalendarIcon
                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                      <p>
                        Closing on <time dateTime={repo.closeDate}>{repo.closeDateFull}</time>
                      </p>
                    </div> */}
                  </div>
                </div>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
