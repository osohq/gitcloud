import { user as userApi } from "../../api";
import { useRouter } from "next/router";
import { OrganizationList } from "../../components/OrganizationList";
import { RepositoryList } from "../../components/RepositoryList";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingPage from "../../components/LoadingPage";

export default function Show() {
  const router = useRouter();
  const { userId } = router.query as { userId: string | undefined };
  if (!userId) return null;
  const {
    data: userProfile,
    isLoading: userLoading,
    error: userError,
  } = userApi().show(userId);
  const {
    data: orgs,
    isLoading: orgLoading,
    error: orgError,
  } = userApi().orgs(userId);
  const {
    data: repos,
    isLoading: repoLoading,
    error: repoError,
  } = userApi().repos(userId);

  if (userLoading || orgLoading || repoLoading) return <LoadingPage />;
  if (userError) return <ErrorMessage error={userError} />;
  if (orgError) return <ErrorMessage error={orgError} />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (!userProfile || !orgs || !repos) return null;

  return (
    <>
      <div className="text-gray-900 text-lg">{userProfile.name}</div>
      <div className="text-gray-600 text-md">{userProfile.email}</div>

      <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Organizations
            </h3>
          </div>
        </div>
      </div>
      <OrganizationList organizations={orgs} />
      <div className="mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Repositories
            </h3>
          </div>
        </div>
      </div>
      <RepositoryList repositories={repos} />
    </>
  );
}
