import {
  UsersIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Org } from "../models/Org";

export function OrganizationList({ organizations: orgs }: { organizations: Org[] }) {
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
                    <div className="ml-2 flex-shrink-0 flex">
                      {org.role &&
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {org.role.toUpperCase()}
                        </p>
                      }
                    </div>
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
