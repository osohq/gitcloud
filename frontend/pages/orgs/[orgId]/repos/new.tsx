import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/router";

import { repo as repoApi, org as orgApi } from "../../../../api";
import { RepoParams } from "../../../../models";
import useUser from "../../../../lib/useUser";
import Router from "next/router";
import { ChevronRightIcon, XCircleIcon } from "@heroicons/react/20/solid";
import LoadingPage from "../../../../components/LoadingPage";
import ErrorMessage from "../../../../components/ErrorMessage";

export default function New() {
  const router = useRouter();
  const { orgId, repoId } = router.query as { orgId?: string; repoId?: string };
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = orgApi().show(orgId);

  const [error, setError] = useState<string[]>([]);
  useUser({ redirectTo: "/login" });
  const [details, setDetails] = useState<RepoParams>({
    name: "",
  });

  const api = repoApi(orgId);

  if (orgLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (!org) return;


  function validInputs() {
    const { name } = details;
    // Don't allow empty strings.
    return name.replaceAll(" ", "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError([])
    if (!validInputs()) return;
    try {
      const repo = await api.create(details);
      await Router.push(`/orgs/${orgId}/repos/${repo.id}`);
    } catch (e: any) {
      setError([e.message]);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDetails({ ...details, [name]: value });
  }

  return (
    <form className="space-y-8 divide-y divide-gray-200" onSubmit={handleSubmit}>
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">New Repository</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new repository
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                  {org.name}
                  <span className="ml-2 pb-0.5 text-md text-gray-400">
                    /
                  </span>
                </span>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={details.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error.length > 0 &&
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">There were errors with your submission</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul role="list" className="list-disc space-y-1 pl-5">
                  {
                    error.map((e, index) =>
                      <li key={`error#{index}`}>{e}</li>
                    )
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create
          </button>
        </div>

      </div>
    </form>
  )

}
