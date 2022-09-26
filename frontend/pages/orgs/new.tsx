import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import { org as orgApi } from "../../api";
import { OrgParams } from "../../models";
import useUser from "../../lib/useUser";
import Router from "next/router";
import { XCircleIcon } from "@heroicons/react/20/solid";

export default function New() {
  const [error, setError] = useState<string[]>([]);
  useUser({ redirectTo: "/login" });
  const api = orgApi();
  const [details, setDetails] = useState<OrgParams>({
    name: "",
    billingAddress: "San Diego",
  });

  function validInputs() {
    const { name, billingAddress } = details;
    // Don't allow empty strings.
    return name.replaceAll(" ", "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError([])
    if (!validInputs()) return;
    try {
      const org = await api.create(details);
      await Router.push(`/orgs/${org.id}`);
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
            <h3 className="text-lg font-medium leading-6 text-gray-900">New Organization</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new organization
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="block w-full min-w-0 flex-1 rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={details.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="billingAddress"
                  id="billingAddress"
                  className="block w-full min-w-0 flex-1 rounded-none rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={details.billingAddress}
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
