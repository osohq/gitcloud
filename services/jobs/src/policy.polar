actor User { }

resource Organization {
     permissions = [
        "read",
        "read_details",
        "view_members",
        "manage_members",
        "set_default_role",
        "create_repositories",
        "delete"
     ];
     roles = ["admin", "member"];

     "read_details" if "member";
     "view_members" if "member";
     "create_repositories" if "member";

     "member" if "admin";
     "manage_members" if "admin";
     "set_default_role" if "admin";
     "delete" if "admin";
}

resource Repository {
     permissions = [
        "read", "create", "update", "delete",
        "invite", "write",
        "read_issues", "manage_issues",  "create_issues",
        "read_jobs", "manage_jobs",
        "view_members", "manage_members"
     ];
     roles = ["reader", "admin", "maintainer", "editor"];
     relations = { organization: Organization };

     "reader" if "member" on "organization";
     "admin" if "admin" on "organization";
     "reader" if "editor";
     "editor" if "maintainer";
     "maintainer" if "admin";

     # reader permissions
     "read" if "reader";
     "read_issues" if "reader";
     "create_issues" if "reader";

     # editor permissions
     "read_jobs" if "editor";
     "write" if "editor";
     "manage_jobs" if "editor";
     "manage_issues" if "editor";
     "view_members" if "maintainer";

     # admin permissions
     "manage_members" if "admin";
     "update" if "admin";
     "delete" if "admin";
     "invite" if "admin" ;
}

resource Issue {
     permissions = ["read", "comment", "close"];
     roles = ["creator"];
     relations = { repository: Repository };

     "read" if "read" on "repository";
     "comment" if "manage_issues" on "repository";
     "close" if "manage_issues" on "repository";

     "close" if "creator";

}

resource Job {
    permissions  = ["read", "cancel"];
    relations = { repository: Repository, owner: User };

    "read" if "read" on "repository";
    "cancel" if "owner";

    "cancel" if "manage_jobs" on "repository";
    "cancel" if "admin" on "repository";
}

has_permission(_: Actor, action: String, repo: Repository) if
     action in ["read", "read_issues", "create_issues"] and
     is_public(repo);


has_permission(actor: Actor, "delete", repo: Repository) if
     has_role(actor, "member", repo) and
     is_protected(repo, false);


# readers can only comment on open issues
has_permission(actor: Actor, "comment", issue: Issue) if
     has_permission(actor, "read", issue) and
     is_closed(issue, false);


# Misc rules:
## All organizations are public
has_permission(_: User, "read", _: Organization);
has_permission(_: User, "create", "Organization");
## Users can read all users
has_permission(_: User, "read", _: User);
## Users can only read their own profiles
has_permission(user: User, "read_profile", user: User);


# Complex rules

# A custom role is defined by the permissions it grants
has_permission(actor: Actor, action: String, org: Organization) if
     role matches Role and
     has_role(actor, role, org) and
     grants_permission(role, action);

has_role(actor: Actor, role: String, repo: Repository) if
     org matches Organization and
     has_relation(repo, "organization", org) and
     has_default_role(org, role) and
     has_role(actor, "member", org);

declare has_relation(Repository, String, Organization);

has_relation(_: Issue, "repository", repo: Repository) if
     in_repo_context(repo);
