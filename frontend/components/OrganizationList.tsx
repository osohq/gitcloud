import {
  UsersIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Org } from "../models/Org";
import { org as orgApi } from "../api/org";

export function OrganizationList({ organizations }: { organizations: Org[] }) {
  const [orgs, setOrgs] = useState<Org[]>(organizations)
  const api = orgApi();

  // useEffect(() => {
  //   const updateOrgs = async () => {
  //     for (const org of orgs) {
  //       const userCount = await api.userCount("" + org.id);
  //       setOrgs((orgs) => orgs.map(item => item.id === org.id ? ({ ...item, userCount }) : item))
  //     }
  //   }
  //   if (orgs) {
  //     updateOrgs()
  //   }
  // }, [organizations]); // eslint-disable-line react-hooks/exhaustive-deps

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
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <UsersIcon
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                        {org.userCount !== undefined ? org.userCount : "-"}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 mt-0 ml-6">
                        <FolderOpenIcon
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                        {org.repositoryCount}
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
  );
}
