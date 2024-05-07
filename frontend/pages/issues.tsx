import { issues } from "../api";
import ErrorMessage from "../components/ErrorMessage";
import { IssueList } from "../components/IssueList";
import LoadingPage from "../components/LoadingPage";

export default function Issues() {
  const { data, isLoading, error } = issues(false);
  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;
  return (
    <>
      <h3 className="text-2xl my-4 leading-6 font-bold text-gray-900">
        Issues
      </h3>
      <IssueList issues={data} />
    </>
  );
}
