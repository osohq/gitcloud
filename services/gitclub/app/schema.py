from flask import g
from typing import ClassVar, Optional, List, cast
import strawberry
from strawberry import ID

import oso_cloud
from datetime import datetime

from .authorization import actions, authorize, list_resources, query, tell, get, cache
from . import models


@strawberry.type
class Issue:
    id: ID
    issue_number: int
    title: str
    creator: "User"
    closed: bool

    @classmethod
    def from_model(cls, issue: models.Issue) -> "Issue":
        return cls(
            id=cast(ID, issue.id),
            issue_number=cast(int, issue.issue_number),
            title=cast(str, issue.title),
            creator=cast("User", issue.creator),
            closed=cast(bool, issue.closed),
        )

    @strawberry.field
    def permissions(self) -> List[str]:
        return actions({"type": "Issue", "id": self.id})


@strawberry.federation.type(keys=["id"])
class Repository:
    id: ID
    name: str
    issue_count: int

    @classmethod
    def from_model(cls, repo: models.Repository) -> "Repository":
        return cls(
            id=cast(ID, repo.id),
            name=cast(str, repo.name),
            issue_count=repo.issue_count,
        )

    @strawberry.field
    def issues(self) -> List["Issue"]:
        authorized_issues = list_resources("read", "Issue", parent=int(self.id))
        issues = g.session.query(models.Issue).filter_by(repo_id=self.id)
        if not "*" in authorized_issues:
            issues = issues.filter(models.Issue.id.in_(authorized_issues))
        return list(map(Issue.from_model, issues.all()))

    @strawberry.field
    def issue(self, issue_id: ID) -> Optional["Issue"]:
        if not authorize(
            "read", {"type": "Issue", "id": issue_id}, parent=int(self.id)
        ):
            return None
        if (
            repo := g.session.query(models.Repository)
            .filter_by(id=issue_id, repo_id=self.id)
            .first()
        ):
            return Issue.from_model(repo)
        else:
            return None

    @strawberry.field
    def permissions(self) -> List[str]:
        return actions({"type": "Repository", "id": self.id})


@cache.memoize()
def user_count(org_id):
    return 0
    # org_users = get(
    #     "has_role",
    #     {
    #         "type": "User",
    #     },
    #     {},
    #     {"type": "Organization", "id": str(org_id)},
    # )
    # return len(list(org_users))


@strawberry.type
class Organization:
    id: ID
    name: str
    billing_address: str
    repository_count: int
    user_count: Optional[int]

    @classmethod
    def from_model(cls, org: models.Organization) -> "Organization":
        return cls(
            id=cast(ID, org.id),
            name=cast(str, org.name),
            billing_address=cast(str, org.billing_address),
            repository_count=org.repository_count,
            user_count=user_count(org.id),
        )

    @strawberry.field
    def repos(self) -> List["Repository"]:
        authorized_repos = list_resources("read", "Repository")
        repos = g.session.query(models.Repository).filter_by(org_id=self.id)
        if not "*" in authorized_repos:
            repos = repos.filter(models.Repository.id.in_(authorized_repos))
        return list(
            map(
                Repository.from_model,
                repos.all(),
            )
        )

    @strawberry.field
    def repo(self, repo_id: ID) -> Optional[Repository]:
        if not authorize("read", {"type": "Repository", "id": repo_id}):
            return None
        if (
            repo := g.session.query(models.Repository)
            .filter_by(id=repo_id, org_id=self.id)
            .first()
        ):
            return Repository.from_model(repo)
        else:
            return None

    @strawberry.field
    def permissions(self) -> List[str]:
        return actions({"type": "Organization", "id": self.id})


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
class Event:
    id: ID
    type: str
    username: Optional[str]
    data: str
    created_at: datetime

    @classmethod
    def from_model(cls, event: models.Event) -> "Event":
        return cls(
            id=cast(ID, event.id),
            username=cast(str, event.username) if event.username else None,
            type=cast(str, event.type),
            data=str(event.data),
            created_at=cast(datetime, event.created_at),
        )


@strawberry.type
class Query:
    @strawberry.field
    def orgs(self) -> List[Organization]:
        authorized_orgs = list_resources("read", "Organization")
        orgs = g.session.query(models.Organization)
        if not "*" in authorized_orgs:
            orgs = orgs.filter(models.Organization.id.in_(authorized_orgs))
        return list(
            map(
                Organization.from_model,
                orgs.all(),
            )
        )

    @strawberry.field
    def org(self, id: ID) -> Optional[Organization]:
        if not authorize("read", {"type": "Organization", "id": id}):
            return None
        if org := g.session.query(models.Organization).filter_by(id=id).first():
            return Organization.from_model(org)
        else:
            return None

    @strawberry.field
    def repo(self, org_id: ID, repo_id: ID) -> Optional[Repository]:
        if not authorize("read", {"type": "Repository", "id": repo_id}):
            return None
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
        if not authorize("read", {"type": "User", "id": username}):
            return None
        user = g.session.query(models.User).filter_by(username=username).first()
        if user:
            return User.from_model(user)
        else:
            return None

    @strawberry.field
    def events(self, since: Optional[datetime]) -> List[Event]:
        if since:
            return list(
                map(
                    Event.from_model,
                    g.session.query(models.Event)
                    .filter(models.Event.created_at > since)
                    .all(),
                )
            )
        else:
            return list(map(Event.from_model, g.session.query(models.Event).all()))


@strawberry.input
class IssueInput:
    title: str
    body: str
    closed: bool
    repo_id: ID


@strawberry.input
class UpdateIssueInput:
    closed: bool


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_organization(self, org: OrganizationInput) -> Organization:
        if not authorize("create", "Organization"):
            raise Exception("Not authorized to create organizations")
        if (
            g.session.query(models.Organization)
            .filter(models.Organization.name == org.name)
            .first()
            is not None
        ):
            raise Exception("Organization with that name already exists")
        org = models.Organization(name=org.name, billing_address=org.billing_address)
        g.session.add(org)
        event = models.Event(
            type="create_org",
            data={
                "username": g.current_user.username,
                "org_name": org.name,
            },
        )
        g.session.add(event)
        g.session.commit()
        tell("has_role", g.current_user, "admin", org)
        return Organization.from_model(org)

    @strawberry.mutation
    def delete_organization(self, id: ID) -> Optional[str]:
        if not authorize("read", {"type": "Organization", "id": id}):
            return None
        if not authorize("delete", {"type": "Organization", "id": id}):
            raise Exception("Not authorized to delete organizations")
        org = g.session.get_or_404(Organization, id=id)
        g.session.delete(org)
        g.session.commit()
        return "deleted"

    @strawberry.mutation
    def create_repository(self, repo: RepositoryInput) -> Optional[Repository]:
        if not authorize("read", {"type": "Organization", "id": id}):
            return None
        if not authorize("create_repositories", {"type": "Organization", "id": id}):
            raise Exception("Not authorized to create repositories")
        if (
            g.session.query(Repository)
            .filter_by(org_id=repo.org_id, name=repo.name)
            .first()
            is not None
        ):
            raise Exception("Repository with that name already exists")

        repo_model = models.Repository(name=repo.name, org_id=repo.org_id)
        g.session.add(repo)
        event = models.Event(
            type="create_repo",
            data={
                "username": g.current_user.username,
                "repo_id": repo_model.id,
            },
        )
        g.session.add(event)
        g.session.commit()

        repoValue = {"type": "Repository", "id": repo_model.id}
        tell(
            "has_relation",
            repoValue,
            "organization",
            {"type": "Organization", "id": repo.name},
        )
        tell("has_role", g.current_user, "admin", repoValue)
        return Repository.from_model(repo_model)

    @strawberry.mutation
    def delete_repository(self, org_id: ID, id: ID) -> Optional[str]:
        if not authorize("read", {"type": "Repository", "id": id}):
            return None
        if not authorize("delete", {"type": "Repository", "id": id}):
            raise Exception("Not authorized to delete repository")
        org = g.session.get_or_404(Repository, repo_id=id, org_id=org_id)
        g.session.delete(org)
        g.session.commit()
        return "deleted"

    @strawberry.mutation
    def create_issue(self, issue: IssueInput) -> Optional[Issue]:
        if not authorize("read", {"type": "Repository", "id": issue.repo_id}):
            return None
        if not authorize("create_issues", {"type": "Repository", "id": issue.repo_id}):
            raise Exception("Not authorized to create issues")
        issue_model = models.Issue(
            title=issue.title, body=issue.body, repo_id=issue.repo_id
        )
        g.session.add(issue_model)
        event = models.Event(
            type="create_issue",
            data={
                "username": g.current_user.username,
                "issue_id": issue_model.id,
            },
        )
        g.session.add(event)
        g.session.commit()
        return Issue.from_model(issue_model)

    @strawberry.mutation
    def delete_issue(self, repo_id: ID, id: ID) -> Optional[str]:
        if not authorize("read", {"type": "Repository", "id": repo_id}):
            return None
        if not authorize("delete", {"type": "Issue", "id": id}):
            raise Exception("Not authorized to delete issue")
        issue = g.session.get_or_404(Issue, repo_id=repo_id, id=id)
        g.session.delete(issue)
        g.session.commit()
        return "deleted"

    @strawberry.mutation
    def update_issue(
        self, repo_id: ID, id: ID, issue: UpdateIssueInput
    ) -> Optional[Issue]:
        if not authorize("read", {"type": "Repository", "id": repo_id}):
            return None
        if not authorize("manage_issues", {"type": "Issue", "id": id}):
            raise Exception("Not authorized to manges issues")
        issue_model = g.session.get_or_404(models.Issue, repo_id=repo_id, id=id)
        issue_model.closed = issue.closed
        g.session.commit()
        return Issue.from_model(issue_model)


schema = strawberry.federation.Schema(
    Query, mutation=Mutation, enable_federation_2=True
)
