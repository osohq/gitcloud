import {
  ChangeEvent,
  FormEvent,
  Fragment,
  useContext,
  useEffect,
  useState,
} from "react";

import { org as orgApi, roleChoices as roleChoicesApi } from "../../api";
import { OrgParams } from "../../models";
import { NoticeContext, RoleSelector } from "../../components";
import useUser from "../../lib/useUser";
import Router from 'next/router';


export default function New() {
  const { currentUser: { user, isLoggedIn } } = useUser({ redirectTo: "/login" });
  const { error, redirectWithError } = useContext(NoticeContext);
  const [details, setDetails] = useState<OrgParams>({
    name: "",
    billingAddress: "",
    baseRepoRole: "",
  });
  const [repoRoleChoices, setRepoRoleChoices] = useState<string[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      roleChoicesApi
        .repo()
        .then((choices) => {
          setDetails((details) => ({
            ...details,
            baseRepoRole: choices[0],
          }));
          setRepoRoleChoices(choices);
        })
        .catch((e) =>
          redirectWithError(`Failed to fetch role choices: ${e.message}`)
        );
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function validInputs() {
    const { name, billingAddress } = details;
    // Don't allow empty strings.
    return name.replaceAll(" ", "") && billingAddress.replaceAll(" ", "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validInputs()) return;
    try {
      const org = await orgApi.create(details);
      await Router.push(`/login`);
    } catch (e) {
      error(`Failed to create new org: ${e}`);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDetails({ ...details, [name]: value });
  }

  return (
    <form onSubmit={handleSubmit}>
      {(["name", "billingAddress"] as const).map((field) => (
        <Fragment key={field}>
          <label>
            {field.replace(/[A-Z]/g, (l) => " " + l.toLowerCase())}:{" "}
            <input
              type="text"
              name={field}
              value={details[field]}
              onChange={handleChange}
            />
          </label>{" "}
        </Fragment>
      ))}
      {repoRoleChoices.length && (
        <label>
          base repo role:{" "}
          <RoleSelector
            choices={repoRoleChoices}
            name="baseRepoRole"
            update={handleChange}
            selected={details.baseRepoRole}
          />
        </label>
      )}{" "}
      <input type="submit" value="create" disabled={!validInputs()} />
    </form>
  );
}
