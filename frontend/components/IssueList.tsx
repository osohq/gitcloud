import {
  UsersIcon,
  MapPinIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Issue } from "../models/Issue";

export function IssueList({
  orgId,
  repoId,
  issues,
}: {
  orgId: number;
  repoId: number;
  issues: Issue[];
}) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {issues.map((issue) => (
          <li key={issue.id}>
            <Link href={`/orgs/${orgId}/repos/${repoId}/issues/${issue.id}`}>
              <a className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {issue.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      {issue.closed ?
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Closed
                        </p> : <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Open
                        </p>
                      }

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
