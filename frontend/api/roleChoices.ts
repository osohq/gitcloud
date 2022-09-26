import useUser from "../lib/useUser";
import { get } from "./common";

const org = () => {
    // const { userId } = useUser();
    return get(`/org_role_choices`) as Promise<string[]>
};

const repo = () => {
    // const { userId } = useUser();

    return get(`/repo_role_choices`) as Promise<string[]>
};

export const roleChoices = { org, repo };
