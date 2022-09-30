import { org as orgApi, useOrgs } from "../api/org";
import useUser from "../lib/useUser";
import Link from "next/link";
import { OrganizationList } from "../components/OrganizationList";
import LoadingPage from "../components/LoadingPage";
import ErrorMessage from "../components/ErrorMessage";

import { gql, useSubscription } from '@apollo/client';


const EVENTS_SUBSCRIPTION = gql`
  subscription GetEvents {
    events {
        type
        data
        createdAt
    }
  }
`;

export default function Events() {
    const {
        currentUser: { isLoggedIn },
    } = useUser();
    const { data, loading, error } = useSubscription(
        EVENTS_SUBSCRIPTION,
    );

    if (loading) {
        return <LoadingPage />;
    }
    if (error) return <ErrorMessage error={error} />;

    return [
        <>
            <div className="sm:mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                    <div className="ml-4 mt-2">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Events
                        </h3>
                    </div>
                    {data && <h4 className="text-lg">New Event: {data}</h4>
                    }


                    {/* 
                    <div className="mt-10">
                        <div className="md:grid md:grid-cols-3 md:gap-6">
                            <div className="md:col-span-1">
                                <div className="px-4 sm:px-0">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Members</h3>
                                    <p className="mt-1 text-sm text-gray-600">Manage organization members, and invite new ones</p>
                                </div>
                            </div>
                            <div className="mt-5 md:col-span-2 md:mt-0">
                                <div>
                                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                        Username
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
                                                    >
                                                        Name
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                                                    >
                                                        Email
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Role
                                                    </th>
                                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                                                        >
                                                            Add user
                                                        </button>
                                                        <span className="sr-only">Remove</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {roleAssignments.map(({ user, role }) => (
                                                    <tr key={user.username}>
                                                        <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-6">
                                                            {user.username}
                                                            <dl className="font-normal lg:hidden">
                                                                <dt className="sr-only">Name</dt>
                                                                <dd className="mt-1 truncate text-gray-700">{user.name}</dd>
                                                                <dt className="sr-only sm:hidden">Email</dt>
                                                                <dd className="mt-1 truncate text-gray-500 sm:hidden">{user.email}</dd>
                                                            </dl>
                                                        </td>
                                                        <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{user.name}</td>
                                                        <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">{user.email}</td>
                                                        <td className="px-3 py-4 text-sm text-gray-500"><RoleSelector choices={roleChoices} selected={role} update={(newRole) => update(user, newRole)} /></td>
                                                        <td className="py-4 pl-3 pr-4 text-right text-sm font-small sm:pr-6">
                                                            <a href="#" className="text-red-600 hover:text-red-900" onClick={(e) => { e.preventDefault(); remove({ user, role }) }}>
                                                                Remove<span className="sr-only">, {user.username}</span>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </>
    ];
}
