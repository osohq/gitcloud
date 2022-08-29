actor User { }

actor Group { }

# Misc rules:
## All organizations are public
has_permission(_: User, "read", _: Organization);
## Users can read all users
has_permission(_: User, "read", _: User);
## Users can only read their own profiles
has_permission(user: User, "read_profile", user: User);
has_permission(_: User, "read_profile", _: User);


resource Organization { 
    permissions = [
        "read",
        "read_details",
        "view_members",
        "manage_members",
        "set_default_role",
        "create_repositories",
    ];
    roles = ["admin", "member"];

    "read_details" if "member";
    "view_members" if "member";
    "create_repositories" if "member";

    "member" if "admin";
    "manage_members" if "admin";
    "set_default_role" if "admin";
}

resource Repository { 
    permissions = ["read", "create", "update", "delete", "invite", "write", "manage_actions"];
    roles = ["reader", "admin", "maintainer", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    
    "read" if "reader";
    "update" if "admin";
    "delete" if "admin";
    "invite" if "admin" ;
    "write" if "editor";
    "manage_actions" if "editor";
}

resource Issue { 
    permissions = ["read", "comment", "close"];
    roles = ["reader", "admin", "creator"];
    relations = { repository: Repository };

    "reader" if "reader" on "repository";
    "admin" if "admin" on "repository";

    "read" if "reader";
    "comment" if "admin";
    "close" if "creator";
    "close" if "admin";
    
}

resource Folder { 
    roles = ["reader", "writer"];
    relations = { repository: Repository, folder: Folder };

    "reader" if "reader" on "repository";
    "reader" if "reader" on "folder";
    "writer" if "maintainer" on "repository";
    "writer" if "writer" on "folder";
}

resource File { 
    permissions = ["read", "write"];
    relations = { folder: Folder };

    "read"  if "reader" on "folder";
    "write" if "writer"  on "folder";
    "read"  if "write";
}

# Actors inherit roles from groups
has_role(user: User, role: String, resource: Resource) if
    group matches Group and
    has_group(user, group) and
    has_role(group, role, resource);

# Nested group
has_group(user: User, group: Group) if
    g matches Group and
    has_group(user, g) and
    has_group(g, group);

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

has_permission(_: Actor, "read", repo: Repository) if
    is_public(repo);


has_permission(actor: Actor, "delete", repo: Repository) if
    has_role(actor, "member", repo) and
    is_protected(repo, false);

# readers can only comment on open issues
has_permission(actor: Actor, "comment", issue: Issue) if
    has_permission(actor, "read", issue) and
    is_closed(issue, false);

allow_with_parent(actor, action, resource: Issue, parent: Repository) if
    has_relation(resource, "repository", parent) and
    allow(actor, action, resource);

allow_with_parent(actor, action, resource: Repository, parent: Organization) if
    has_relation(resource, "organization", parent) and
    allow(actor, action, resource);
