import { ChangeEvent, FormEvent, useContext, useState } from "react";

import { issue as issueApi } from "../../../../../../api";
import useUser from "../../../../../../lib/useUser";
import { useRouter } from "next/router";
import ErrorPage from "../../../../../../components/ErrorMessage";

export default function New() {
  const {
    currentUser: { user },
  } = useUser({ redirectTo: "/login" });
  const router = useRouter();
  const { orgId, repoId } = router.query as { orgId?: string; repoId?: string };

  const [error, setError] = useState<Error | undefined>(undefined);
  const [title, setTitle] = useState<string>("");
  const index = `/orgs/${orgId}/repos/${repoId}/issues`;
  const api = issueApi(orgId, repoId)

  const inputEmpty = !title.replaceAll(" ", "");
  if (error) return <ErrorPage error={error} setError={setError} />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty || !orgId || !repoId) return;
    try {
      const issue = await api.create({ title });
      await router.push(`${index}/${issue.id}`);
    } catch (e: any) {
      setError(e)
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setTitle(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        title: <input type="text" value={title} onChange={handleChange} />
      </label>{" "}
      <input type="submit" value="create" disabled={inputEmpty} />
    </form>
  );
}
