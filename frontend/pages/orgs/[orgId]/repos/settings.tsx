import { useContext, useEffect, useState } from "react";

import { Org, Repo, RoleAssignment } from "../../../../models";
import {
  NewRoleAssignment,
  NoticeContext,
  RoleAssignments,
} from "../../../../components";
import {
  org as orgApi,
  repo as repoApi,
  roleAssignments as roleAssignmentsApi,
  roleChoices as roleChoicesApi,
} from "../../../../api";
import useUser from "../../../../lib/useUser";
import Link from 'next/link';

type Props = { orgId?: string; repoId?: string };

export default function Settings({ orgId, repoId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const { error, redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    repoApi(orgId)
      .show(repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [user, orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    roleChoicesApi
      .repo()
      .then(setRoleChoices)
      .catch((e) => error(`Failed to fetch repo role choices: ${e.message}`));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orgId || !repoId) return null;
  const show = `/orgs/${orgId}/repos/${repoId}`;

  if (!org || !repo) return null;

  const api = roleAssignmentsApi.repo(orgId, repoId);

  return (
    <>
      <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> /{" "}
        <Link href={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /
        settings
      </h1>

      <h2>Manage Access</h2>

      <RoleAssignments
        api={api}
        assignments={roleAssignments}
        roleChoices={roleChoices}
        setAssignments={setRoleAssignments}
        setRefetch={setRefetch}
      />

      <h3>Invite people</h3>

      {roleChoices.length && (
        <NewRoleAssignment
          api={api}
          refetch={refetch}
          roleChoices={roleChoices}
          setAssignments={setRoleAssignments}
          setRefetch={setRefetch}
        />
      )}
    </>
  );
}
