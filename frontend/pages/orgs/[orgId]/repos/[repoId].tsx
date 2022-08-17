import { useContext, useEffect, useState } from "react";

import { Org, Repo } from "../../../../models";
import { org as orgApi, repo as repoApi } from "../../../../api";
import { NoticeContext } from "../../../../components";
import useUser from "../../../../lib/useUser";
import Link from 'next/link';
import { useRouter } from 'next/router';


export default function Show() {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const router = useRouter()
  const { orgId, repoId } = router.query as { orgId: string, repoId: string };

  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();

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

  if (!orgId || !org || !repoId || !repo) return null;

  return (
    <>
      <h1>
        <Link href={`/orgs/${org.id}`}>{org.name}</Link> / {repo.name}
      </h1>
      <h2>
        <Link href={`/orgs/${orgId}/repos/${repoId}/issues`}>Issues</Link>
      </h2>
      <h2>
        <Link href={`/orgs/${orgId}/repos/${repoId}/actions`}>Actions</Link>
      </h2>
      <h2>
        <Link href={`/orgs/${orgId}/repos/${repoId}/settings`}>Settings</Link>
      </h2>
    </>
  );
}
