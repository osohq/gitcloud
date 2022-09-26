import { useEffect, useState } from "react";

import { RoleAssignment, User } from "../../../models";
import {
    RoleSelector,
} from "../../../components/RoleSelector";
import {
    org as orgApi,
    roleAssignments as roleAssignmentsApi,
    roleChoices as roleChoicesApi,
} from "../../../api";
import useUser from "../../../lib/useUser";
import Link from "next/link";
import { useRouter } from "next/router";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingPage from "../../../components/LoadingPage";
import Confirm from "../../../components/Confirm";


export default function Settings() {
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
        data: roleAssignments,
        isLoading: rolesLoading,
        error: rolesError,
        mutate: setAssignments
    } = roleAssignmentsApi.org(orgId).index();

    useEffect(() => {
        roleChoicesApi.org().then(setRoleChoices);
        // .catch((e) => error(`Failed to fetch repo role choices: ${e.message}`));
    }, [user]);
    const [roleChoices, setRoleChoices] = useState<string[]>([]);

    const [open, setOpen] = useState(false)
    const [error, setError] = useState<Error | undefined>(undefined);


    if (orgLoading || rolesLoading) return <LoadingPage />;
    if (orgError) return <ErrorMessage error={orgError} />;
    if (rolesError) return <ErrorMessage error={rolesError} />;
    if (error) return <ErrorMessage setError={setError} error={error} />;
    if (!orgId || !org || !roleAssignments) return null;


    const api = roleAssignmentsApi.org(orgId);

    function update(user: User, role: string) {
        api.update({ username: user.username, role }).then((next) => {
            const { username } = next.user;
            // NOTE(gj): Assumes a user has a single role per resource.
            setAssignments((as) =>
                as?.map((a) => (a.user.username === username ? next : a))
            );
        }).catch(setError);
    }

    function remove({ user, role }: RoleAssignment) {
        api.delete({ username: user.username, role }).then(() => {
            // NOTE(gj): Assumes a user has a single role per resource.
            setAssignments((as) =>
                as?.filter((a) => a.user.username !== user.username)
            );
        }).catch(setError);
    }

    function deleteOrg() {
        orgApi.del(orgId!).then(() => {
            router.replace(`/orgs`);
        }).catch(setError);
    }

    return (
        <>
            <div className="mt-2">
                <div className="mb-5 lg:flex lg:items-center lg:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight sm:truncate">
                            <Link href={{ pathname: "/orgs/[orgId]", query: { orgId } }}>
                                {org.name}
                            </Link>
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Settings
                        </p>
                    </div>
                </div>
            </div>

            <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                    <div className="border-t border-gray-200" />
                </div>
            </div>

            <div>
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <div className="px-4 sm:px-0">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Billing</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Configure billing settings
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 md:col-span-2 md:mt-0">
                        <form action="#" method="POST">
                            <div className="shadow sm:overflow-hidden sm:rounded-md">
                                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="col-span-3 sm:col-span-2">
                                            <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                                                Location
                                            </label>
                                            <div className="mt-1 flex rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    name="billingAddress"
                                                    id="billingAddress"
                                                    className="block w-full min-w-0 flex-1 rounded-none rounded border-gray-300 sm:text-sm"
                                                    value={org.billingAddress}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-400 py-2 px-4 text-sm font-medium text-gray-100 shadow-sm"
                                        disabled
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                    <div className="border-t border-gray-200" />
                </div>
            </div>


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
            </div>

            <div className="hidden sm:block" aria-hidden="true">
                <div className="py-5">
                    <div className="border-t border-gray-200" />
                </div>
            </div>


            <div className="mt-10">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <div className="px-4 sm:px-0">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Danger Zone</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Very destructive things. Take care.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 md:col-span-2 md:mt-0">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setOpen(true);
                        }}>
                            <div className="shadow sm:overflow-hidden sm:rounded-md">
                                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="col-span-3 sm:col-span-2 flex">
                                            <label htmlFor="delete" className=" text-sm font-medium text-red-700">
                                                Delete Organization
                                            </label>
                                            <div className="px-4 text-right sm:px-6">
                                                <button
                                                    type="submit"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-red-500 py-2 px-4 text-sm font-medium text-white shadow-sm"
                                                >
                                                    Delete
                                                </button>
                                                <Confirm title={"Delete organization"} dialog={"Are you sure you want to delete this organization? All of your data will be permanently removed from our servers forever. This action cannot be undone."} onConfirm={deleteOrg} open={open} setOpen={setOpen} />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>


        </>
    )
}
