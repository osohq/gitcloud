import { ChangeEvent, FormEvent, useContext, useEffect, useState } from "react";

import { NoticeContext } from "../components";
import { session as sessionApi } from "../api";
import { useRouter } from "next/router";
import useUser from "../lib/useUser";

export default function Logout() {
    const { currentUser, mutateUser } = useUser();
    const router = useRouter();
    const { error } = useContext(NoticeContext);

    // If a logged-out user navigates to this page, redirect to home.
    useEffect(() => {
        sessionApi.logout().then(() => {
            router.replace(`/`);
            mutateUser(undefined)
        })
    }, []);

    return (
        <p>
            Logging out...
        </p>
    );
}

Logout.title = "Sign Out";
