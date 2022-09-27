import { org as orgApi } from "../../api";
import useUser from "../../lib/useUser";
import Link from "next/link";
import { OrganizationList } from "../../components/OrganizationList";
import LoadingPage from "../../components/LoadingPage";
import ErrorMessage from "../../components/ErrorMessage";

export default function Index() {
  const {
    currentUser: { isLoggedIn },
  } = useUser();
  const { data: orgs, isLoading, error: orgError } = orgApi().index();

  if (isLoading) {
    return <LoadingPage />;
  }
  if (isLoading) return <LoadingPage />;
  if (orgError) return <ErrorMessage error={orgError} />;

  if (!orgs) return null;

  return [
    <>
      <div className="sm:mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Organizations
            </h3>
          </div>
          <div className="ml-4 mt-2 flex-shrink-0">
            <Link href="/orgs/new">
              <button
                type="button"
                className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={!isLoggedIn}
              >
                Create new organization
              </button>
            </Link>
          </div>
        </div>
      </div>

      <OrganizationList organizations={orgs} />
    </>
  ];
}
