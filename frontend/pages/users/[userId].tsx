import { user as userApi } from "../../api";
import { useRouter } from "next/router";
import { OrganizationList } from "../../components/OrganizationList";
import { RepositoryList } from "../../components/RepositoryList";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingPage from "../../components/LoadingPage";
import { gql, useQuery } from '@apollo/client';


const GET_USER = gql`
  query GetUser($userId: ID!) {
    user(username: $userId) {
      username
      name
      email
      orgs {
        id
        name
        billingAddress
        repositoryCount
        userCount
        permissions
        role
      }
      repos {
        id
        name
        issueCount
        permissions
        role
        public
        orgId
      }
    }
  }
  `;


export default function Show() {
  const router = useRouter();
  const { userId } = router.query as { userId: string | undefined };
  const { data, loading, error } = useQuery(GET_USER, { variables: { userId: userId } });

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMessage error={error} />;
  if (!userId || !data) return null;

  const user = data.user;
  const orgs = data.user.orgs;
  const repos = data.user.repos;

  return (
    <>
      <div className="text-gray-900 text-lg">{user.name}</div>
      <div className="text-gray-600 text-md">{user.email}</div>

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
