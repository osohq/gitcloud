actor User { }

actor Group { }

resource Organization { 
    permissions = ["set_default_role"];
    roles = ["admin", "member"];

    "member" if "admin";
    "set_default_role" if "admin";
}

resource Repository { 
    permissions = ["read", "create", "update", "delete", "invite", "write"];
    roles = ["reader", "admin", "maintainer", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    
    "read" if "reader";
    "create" if "admin";
    "update" if "admin";
    "delete" if "admin";
    "invite" if "admin" ;
    "write" if "editor";
}

resource Issue { 
    permissions = ["read", "comment", "close"];
    roles = ["reader", "admin", "creator"];

    "read" if "reader";
    "comment" if "reader";
    
    "close" if "creator";
    "close" if "admin";
    
    "reader" if "admin";
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

# Nested groups
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

allow(actor: Actor, action: String, resource: Resource) if
    is_active(actor) and
    has_permission(actor, action, resource);

has_permission(actor: Actor, "delete", repo: Repository) if
    has_role(actor, "member", repo) and
    is_protected(repo, false);

