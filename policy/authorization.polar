actor User { }
actor Group { }

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
     roles = [
          "public_viewer",
          "reader", "admin", "maintainer", "editor"
     ];
     relations = { organization: Organization };


     # role assignments
     "public_viewer" if is_public(resource);
     "admin" if "admin" on "organization";
     "reader" if "editor";
     "editor" if "maintainer";
     "maintainer" if "admin";

     # public viewer
     "read" if "public_viewer";
     "read_issues" if "public_viewer";
     "create_issues" if "public_viewer";

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
     relations = { repository: Repository, creator: User };

     "read" if "read" on "repository";
     "comment" if "manage_issues" on "repository";
     "close" if "manage_issues" on "repository";

     "close" if "creator";

     "comment" if "read" and is_closed(resource, false);
}


### Repository default role assignments

# org members get the default org role on a repository
# unless the repository defines its own role
has_role(user: User, role: String, repository: Repository) if
     org matches Organization and
     has_relation(repository, "organization", org) and
     has_role(user, "member", org) and
     has_default_role(org, role) and
     not member_role(repository, _repo_role);

has_role(user: User, role: String, repository: Repository) if
     org matches Organization and
     has_relation(repository, "organization", org) and
     has_role(user, "member", org) and
     member_role(repository, role);


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



# Policy tests
# Organization members inherit the read permission
# on repositories that belong to the org
# and issues that belong to those repositories
test "organization members can read repos and issues" {
    # Define test data (facts)
    setup {
        # alice is a member of the "acme" organization
        has_role(User{"alice"}, "member", Organization{"acme"});
        has_default_role(Organization{"acme"}, "editor");
     
        # The "test-repo" Repository belongs to the "acme" organization
        has_relation(Repository{"test-repo"}, "organization", Organization{"acme"});
        # The issue "Issue 1" belongs to the "test-repo" repository
        has_relation(Issue{"Issue 1"}, "repository", Repository{"test-repo"});

        is_closed(Issue{"Issue 1"}, true);
    }

    # alice can read the "test-repo" Repository
    assert allow(User{"alice"}, "read", Repository{"test-repo"});
    # alice can read the issue "Issue 1"
    assert allow(User{"alice"}, "read", Issue{"Issue 1"});
    # alice can not delete the "test-repo" Repository
    assert_not allow(User{"alice"}, "delete", Repository{"test-repo"});
}
