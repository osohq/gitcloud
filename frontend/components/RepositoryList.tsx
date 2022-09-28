import {
  HashtagIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Repo } from "../models/Repo";

export function RepositoryList({ repositories }: { repositories: Repo[] }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {repositories.map((repo) => (
          <li key={repo.id}>
            <Link href={{ pathname: "/orgs/[orgId]/repos/[repoId]", query: { orgId: repo.orgId, repoId: repo.id } }}>
              <a className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {repo.name}
                    </p>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <HashtagIcon
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                        {repo.issueCount}
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
