import { useContext, useEffect, useState } from "react";

import { Org, Repo, RoleAssignment } from "../../../../../models";
import {
  NewRoleAssignment,
  NoticeContext,
  RoleAssignments,
} from "../../../../../components";
import {
  org as orgApi,
  repo as repoApi,
  roleAssignments as roleAssignmentsApi,
  roleChoices as roleChoicesApi,
} from "../../../../../api";
import useUser from "../../../../../lib/useUser";
import Link from 'next/link';
import { useRouter } from "next/router";
import ErrorMessage from "../../../../../components/ErrorMessage";
import LoadingPage from "../../../../../components/LoadingPage";

export default function Settings() {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const router = useRouter();
  const { orgId, repoId } = router.query as { orgId: string, repoId: string };
  const { data: org, isLoading: orgLoading, error: orgError } = orgApi.show(orgId);
  const { data: repo, isLoading: repoLoading, error: repoError } = repoApi(orgId).show(repoId);

  useEffect(() => {
    roleChoicesApi
      .repo()
      .then(setRoleChoices)
    // .catch((e) => error(`Failed to fetch repo role choices: ${e.message}`));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);


  if (orgLoading || repoLoading) return <LoadingPage />;
  if (repoError) return <ErrorMessage error={repoError} />;
  if (orgError) return <ErrorMessage error={orgError} />;
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
