import { useContext, useEffect, useState } from "react";

import { Repo, User } from "../../../../models";
import { userRepo as repoApi } from "../../../../api";
import { user as userApi } from "../../../../api";
import { NoticeContext } from "../../../../components";
import useUser from "../../../../lib/useUser";
import Link from 'next/link';

type Props = { userId?: string };

export default function Index({ userId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser({ redirectTo: "/login" });
  const { redirectWithError } = useContext(NoticeContext);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [userProfile, setUser] = useState<User>();

  useEffect(() => {
    if (!userId) return;
    userApi.show(userId).then(setUser).catch(redirectWithError);
  }, [user, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) return;
    repoApi(userId)
      .index()
      .then(setRepos)
      .catch((e) => redirectWithError(`Failed to fetch repos: ${e.message}`));
  }, [user, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId || !userProfile) return null;

  return (
    <>
      <h1>
        <Link href={`/users/${userId}`}>{userProfile.username}</Link> repos
      </h1>
      <ul>
        {repos.map((r) => (
          <li key={"repo-" + r.id}>
            <Link href={`/orgs/${r.orgId}/repos/${r.id}`}>{r.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
