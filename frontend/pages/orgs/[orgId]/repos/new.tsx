import { ChangeEvent, FormEvent, useContext, useState } from "react";
import { NoticeContext } from "../../../../components";
import { repo as repoApi } from "../../../../api";
import useUser from "../../../../lib/useUser";
import Router from 'next/router';

type Props = { orgId?: string };

export default function New({ orgId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser({ redirectTo: "/login" });
  const { error } = useContext(NoticeContext);
  const [name, setName] = useState<string>("");
  const index = `/orgs/${orgId}/repos`;

  const inputEmpty = !name.replaceAll(" ", "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty || !orgId) return;
    try {
      const repo = await repoApi(orgId).create({ name });
      await Router.push(`${index}/${repo.id}`);
    } catch (e) {
      error(`Failed to create new repo: ${e}`);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setName(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        name: <input type="text" value={name} onChange={handleChange} />
      </label>{" "}
      <input type="submit" value="create" disabled={inputEmpty} />
    </form>
  );
}
