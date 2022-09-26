import { useEffect, useState } from "react";

import { session as sessionApi } from "../api";
import { useRouter } from "next/router";
import useUser from "../lib/useUser";
import ErrorPage from "../components/ErrorMessage";

export default function Logout() {
    const { currentUser, mutateUser } = useUser();
    const router = useRouter();
    const [error, setError] = useState<Error | undefined>(undefined);

    // If a logged-out user navigates to this page, redirect to home.
    useEffect(() => {
        sessionApi.logout().then(() => {
            router.replace(`/`);
            mutateUser(undefined)
        }).catch(setError)
    }, [router, mutateUser]);

    if (error) return <ErrorPage error={error} setError={setError} />

    return (
        <p>
            Logging out...
        </p>
    );
}

Logout.title = "Sign Out";
