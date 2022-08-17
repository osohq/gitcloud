import { useContext, useEffect, useState } from "react";

import { Org, RoleAssignment } from "../../models";
import {
  org as orgApi,
  roleAssignments as roleAssignmentsApi,
  roleChoices as roleChoicesApi,
} from "../../api";
import {
  NewRoleAssignment,
  NoticeContext,
  RoleAssignments,
} from "../../components";
import useUser from "../../lib/useUser";
import Link from 'next/link';

type Props = { orgId?: string };

export default function Show({ orgId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const { error, redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    orgApi.show(orgId).then(setOrg).catch(redirectWithError);
  }, [user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    roleChoicesApi
      .org()
      .then(setRoleChoices)
      .catch((e) => error(`Failed to fetch org role choices: ${e.message}`));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orgId || !org) return null;

  const api = roleAssignmentsApi.org(orgId);

  return (
    <>
      <h1>{org.name}</h1>
      <h4>Billing Address: {org.billingAddress}</h4>
      <h4>Base Repo Role: {org.baseRepoRole}</h4>

      <h2>
        <Link href={`/orgs/${orgId}/repos`}>Repos</Link>
      </h2>

      <h2>People</h2>

      <RoleAssignments
        api={api}
        assignments={roleAssignments}
        roleChoices={roleChoices}
        setAssignments={setRoleAssignments}
        setRefetch={setRefetch}
      />

      <h3>Invite new members</h3>

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
