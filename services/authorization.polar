actor User {}

resource Org {
  roles = ["owner", "driver", "viewer"];
  "driver" if "owner";
  "viewer" if "driver";
}

has_fact_permission(user: User, "get", "has_role", _, _, org: Org) if
  has_role(user, "viewer", org);

has_fact_permission(user: User, "delete", "has_role", _, _, org: Org) if
  has_role(user, "driver", org);

has_fact_permission(user: User, "tell", "has_role", _, _, org: Org) if
  has_role(user, "owner", org);