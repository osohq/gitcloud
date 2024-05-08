import { Listbox } from "@headlessui/react";
import { issues } from "../api";
import ErrorMessage from "../components/ErrorMessage";
import { IssueList } from "../components/IssueList";
import LoadingPage from "../components/LoadingPage";
import { useState } from "react";

export default function Issues() {
  const [close, setClose] = useState(false);
  const { data, isLoading, error } = issues(close);
  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;
  return (
    <>
      <div className="flex items-center justify-between my-4 ">
        <h3 className="text-2xl font-bold text-gray-900">Issues</h3>
        <div className="flex items-center space-x-2">
          <input
            id="close-checkbox"
            type="checkbox"
            checked={close}
            onChange={() => setClose(!close)}
          />
          <label htmlFor="close-checkbox" className="cursor-pointer">
            Only show issues I can close
          </label>
        </div>
      </div>
      <IssueList issues={data} />
    </>
  );
}
