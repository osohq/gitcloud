import { useContext, useEffect, useState } from "react";

import { User } from "../../models";
import { user as userApi } from "../../api";
import { NoticeContext } from "../../components";
import useUser from "../../lib/useUser";
import Link from 'next/link';

type Props = { userId?: string };

export default function Show({ userId }: Props) {
  const { currentUser: { user, isLoggedIn } } = useUser();
  const { redirectWithError } = useContext(NoticeContext);
  const [userProfile, setUser] = useState<User>();

  useEffect(() => {
    if (!userId) return;
    userApi.show(userId).then(setUser).catch(redirectWithError);
  }, [user, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId || !userProfile) return null;

  return (
    <>
      <h1>{userProfile.username}</h1>
      <h2>
        <Link href={`/users/${userId}/repos`}>Repos</Link>
      </h2>
    </>
  );
}
