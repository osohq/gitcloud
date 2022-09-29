from unittest.util import strclass
from flask import g
from typing import Optional, List, cast
import strawberry
from strawberry import ID
import oso_cloud

from .authorization import query, tell, get
from . import models

# This is the GraphQL Schema object
schema = None


@strawberry.type
class Repository:
    id: ID
    name: str
    org_id: ID
    issue_count: int
    permissions: List[str]

    @classmethod
    def from_model(cls, repo: models.Repository) -> "Repository":
        return cls(
            id=cast(ID, repo.id),
            name=cast(str, repo.name),
            org_id=cast(ID, repo.org_id),
            issue_count=repo.issue_count,
            permissions=[],
        )


@strawberry.type
class Organization:
    id: ID
    name: str
    billing_address: str
    repository_count: int
    user_count: Optional[int]
    permissions: List[str]

    @classmethod
    def from_model(cls, org: models.Organization) -> "Organization":
        return cls(
            id=cast(ID, org.id),
            name=cast(str, org.name),
            billing_address=cast(str, org.billing_address),
            repository_count=org.repository_count,
            user_count=None,
            permissions=[],
        )

    @strawberry.field
    def repos(self) -> List["Repository"]:
        return list(
            map(
                Repository.from_model,
                g.session.query(models.Repository).filter_by(org_id=self.id).all(),
            )
        )


@strawberry.input
class OrganizationInput:
    name: str
    billing_address: str


@strawberry.input
class RepositoryInput:
    name: str
    org_id: ID


@strawberry.type
class User:
    username: ID
    email: str
    name: str

    @classmethod
    def from_model(cls, user: models.User) -> "User":
        return cls(
            username=cast(ID, user.username),
            name=cast(str, user.name),
            email=cast(str, user.email),
        )

    @strawberry.field
    def orgs(self) -> List[Organization]:
        # get all the repositories that the user has a role for
        orgs = get(
            "has_role",
            {"type": "User", "id": self.username},
            {},
            {"type": "Organization"},
        )
        orgIds = list(
            map(
                lambda fact: cast(oso_cloud.Value, fact["args"][2]).get("id", "_"), orgs
            )
        )
        orgs = []
        if "_" in orgIds:
            orgs = g.session.query(models.Organization)
        else:
            orgs = g.session.query(models.Organization).filter(
                models.Organization.id.in_(orgIds)
            )

        return list(map(Organization.from_model, orgs))

    @strawberry.field
    def repos(self) -> List["Repository"]:
        repos = query(
            "has_role",
            {"type": "User", "id": self.username},
            {},
            {"type": "Repository"},
        )
        repoIds = list(
            map(
                lambda fact: cast(oso_cloud.Value, fact["args"][2]).get("id", "_"),
                repos,
            )
        )
        repo_models = []
        if "_" in repoIds:
            repo_models = g.session.query(models.Repository)
        else:
            repo_models = g.session.query(models.Repository).filter(
                models.Repository.id.in_(repoIds)
            )
        return list(map(Repository.from_model, repo_models))


@strawberry.type
class Issue:
    pass


@strawberry.type
class Query:
    @strawberry.field
    def orgs(self) -> List[Organization]:
        return list(
            map(
                Organization.from_model,
                g.session.query(models.Organization).all(),
            )
        )

    @strawberry.field
    def org(self, id: ID) -> Optional[Organization]:
        if org := g.session.query(models.Organization).filter_by(id=id).first():
            return Organization.from_model(org)
        else:
            return None

    @strawberry.field
    def repo(self, org_id: ID, repo_id: ID) -> Optional[Repository]:
        if (
            org := g.session.query(models.Repository)
            .filter_by(id=repo_id, org_id=org_id)
            .first()
        ):
            return Repository.from_model(org)
        else:
            return None

    @strawberry.field
    def user(self, username: ID) -> Optional[User]:
        user = g.session.query(models.User).filter_by(username=username).first()
        if user:
            return User.from_model(user)
        else:
            return None


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_organization(self, org: OrganizationInput) -> Organization:
        if (
            g.session.query(models.Organization)
            .filter(models.Organization.name == org.name)
            .first()
            is not None
        ):
            raise Exception("Organization with that name already exists")
        org = models.Organization(name=org.name, billing_address=org.billing_address)
        g.session.add(org)
        g.session.commit()
        tell("has_role", g.current_user, "admin", org)
        return Organization.from_model(org)

    @strawberry.mutation
    def delete_organization(self, id: ID) -> str:
        org = g.session.get_or_404(Organization, id=id)
        g.session.delete(org)
        g.session.commit()
        return "deleted"

    @strawberry.mutation
    def create_repository(self, repo: RepositoryInput) -> Repository:
        if (
            g.session.query(Repository)
            .filter_by(org_id=repo.org_id, name=repo.name)
            .first()
            is not None
        ):
            raise Exception("Repository with that name already exists")

        repo_model = models.Repository(name=repo.name, org_id=repo.org_id)
        g.session.add(repo)
        g.session.commit()
        repoValue = {"type": "Repository", "id": repo_model.id}
        tell(
            "has_relation",
            repoValue,
            "organization",
            {"type": "Organization", "id": repo.org_id},
        )
        tell("has_role", g.current_user, "admin", repoValue)
        return Repository.from_model(repo_model)

    @strawberry.mutation
    def delete_repository(self, org_id: ID, id: ID) -> str:
        org = g.session.get_or_404(Repository, repo_id=id, org_id=org_id)
        g.session.delete(org)
        g.session.commit()
        return "deleted"


schema = strawberry.Schema(Query, mutation=Mutation)
