import { ChangeEvent, FormEvent, useContext, useState } from "react";

import { issue as issueApi } from "../../../../../../api";
import { NoticeContext } from "../../../../../../components";
import useUser from "../../../../../../lib/useUser";
import { useRouter } from "next/router";

export default function New() {
  const {
    currentUser: { user },
  } = useUser({ redirectTo: "/login" });
  const router = useRouter();
  const { orgId, repoId } = router.query as { orgId?: string; repoId?: string };

  const { error } = useContext(NoticeContext);
  const [title, setTitle] = useState<string>("");
  const index = `/orgs/${orgId}/repos/${repoId}/issues`;

  const inputEmpty = !title.replaceAll(" ", "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty || !orgId || !repoId) return;
    try {
      const issue = await issueApi(orgId, repoId).create({ title });
      await router.push(`${index}/${issue.id}`);
    } catch (e) {
      error(`Failed to create new issue: ${e}`);
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
