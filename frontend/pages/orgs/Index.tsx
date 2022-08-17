import { useContext, useEffect, useState } from "react";

import { Org } from "../../models";
import { org as orgApi } from "../../api";
import { NoticeContext } from "../../components";
import useUser from "../../lib/useUser";
import Link from 'next/link';

export default function Index() {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const { redirectWithError } = useContext(NoticeContext);
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    orgApi.index().then(setOrgs).catch(redirectWithError);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const maybeNewLink = !isLoggedIn ? null : (
    <Link href={`/orgs/new`}>Create new organization</Link>
  );

  return (
    <>
      <h1>Orgs</h1>
      <ul>
        {orgs.map((o) => (
          <li key={"org-" + o.id}>
            <Link href={`/orgs/${o.id}`}>{o.name}</Link>
          </li>
        ))}
      </ul>
      {maybeNewLink}
    </>
  );
}

Index.title = "Organizations";