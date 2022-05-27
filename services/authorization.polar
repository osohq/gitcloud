allow(actor, action, resource) if
  has_permission(actor, action, resource);

# Users can see each other.
has_permission(_: User, "read", _: User);

# A User can read their own profile.
has_permission(user: User, "read_profile", user: User);

# Any logged-in user can create a new org.
has_permission(_: User, "create", _: Org);

actor User {
  permissions = ["read"];
}

resource Org {
  roles = ["owner", "member"];
  permissions = [
    "read",
    "create_repos",
    "list_repos",
    "create_role_assignments",
    "list_role_assignments",
    "update_role_assignments",
    "delete_role_assignments",
  ];

  "read" if "member";
  "list_repos" if "member";
  "list_role_assignments" if "member";

  "create_repos" if "owner";
  "create_role_assignments" if "owner";
  "update_role_assignments" if "owner";
  "delete_role_assignments" if "owner";

  "member" if "owner";
}

resource Repo {
  roles = ["admin", "maintainer", "reader"];
  permissions = [
    "read",
    "create_issues",
    "list_issues",
    "create_role_assignments",
    "list_role_assignments",
    "update_role_assignments",
    "delete_role_assignments",
    "schedule_action",
    "view_actions",
  ];
  relations = { parent: Org };

  "create_role_assignments" if "admin";
  "list_role_assignments" if "admin";
  "update_role_assignments" if "admin";
  "delete_role_assignments" if "admin";

  "schedule_action" if "maintainer";

  "read" if "reader";
  "list_issues" if "reader";
  "create_issues" if "reader";
  "view_actions" if "reader";

  "admin" if "owner" on "parent";
  "reader" if "member" on "parent";

  "maintainer" if "admin";
  "reader" if "maintainer";
}

resource Issue {
  roles = ["creator"];
  permissions = ["read", "close"];
  relations = { parent: Repo };
  "read" if "reader" on "parent";
  "close" if "maintainer" on "parent";
  "close" if "creator";
}

resource Action {
  relations = { creator: User, repo: Repo };
  permissions = ["view", "cancel"];

  "view" if "reader" on "repo";
  "cancel" if "creator";
  "cancel" if "admin" on "repo";
}
