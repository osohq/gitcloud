import {
  UsersIcon,
  MapPinIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Issue } from "../models/Issue";
import { user as userApi } from "../api";
import { useEffect, useState } from "react";
import { User } from "../models";
import { get } from "../api/common";
import useUser from "../lib/useUser";
import useSWR from "swr";

function IssueItem({ issue }: { issue: Issue }) {
  const orgId = 0;
  const { userId } = useUser();
  const { data: creator, error: creatorError } = useSWR<User>(
    `/accounts/users/${issue.creatorId}`,
    (p: string) => get(p, userId)
  );

  return (
    <Link href={`/orgs/${orgId}/repos/${issue.repoId}/issues/${issue.id}`}>
      <a className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center">
            <p className="text-sm font-medium text-indigo-600 truncate">
              {issue.title}
            </p>
            <div className="font-light text-xs mx-4">
              Creator: {creator?.username}
            </div>
            <div className="grow" />
            <div className="ml-2 flex-shrink-0 flex">
              {issue.closed ? (
                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                  Closed
                </p>
              ) : (
                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Open
                </p>
              )}
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}

export function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {issues.map((issue) => (
          <li key={issue.id}>
            <IssueItem issue={issue} />
          </li>
        ))}
      </ul>
    </div>
  );
}
