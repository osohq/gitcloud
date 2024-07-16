
import typing
from typing import List, Literal, Tuple, Union
from oso_cloud import Oso, Value, Fact
from dataclasses import dataclass


@dataclass
class Group:
    id: str
    type = "Group"

    def __init__(self, id: typing.Any):
        self.id = str(id)

    def as_value(self) -> Value:
        return {"type": self.type, "id": self.id}
    
GroupActions = typing.NoReturn
GroupRoles = typing.NoReturn
GroupRelations = typing.NoReturn

@dataclass
class Issue:
    id: str
    type = "Issue"

    def __init__(self, id: typing.Any):
        self.id = str(id)

    def as_value(self) -> Value:
        return {"type": self.type, "id": self.id}
    
IssueActions = Literal['close', 'comment', 'read']
IssueRoles = typing.NoReturn
IssueCreatorRelation = Tuple[Issue, Literal['creator'], "User"]
IssueRepositoryRelation = Tuple[Issue, Literal['repository'], "Repository"]
IssueRelations = Union[IssueCreatorRelation, IssueRepositoryRelation]

@dataclass
class Organization:
    id: str
    type = "Organization"

    def __init__(self, id: typing.Any):
        self.id = str(id)

    def as_value(self) -> Value:
        return {"type": self.type, "id": self.id}
    
OrganizationActions = Literal['create_repositories', 'delete', 'manage_members', 'read', 'read_details', 'set_default_role', 'view_members']
OrganizationRoles = Literal['admin', 'member']
OrganizationRelations = typing.NoReturn

@dataclass
class Repository:
    id: str
    type = "Repository"

    def __init__(self, id: typing.Any):
        self.id = str(id)

    def as_value(self) -> Value:
        return {"type": self.type, "id": self.id}
    
RepositoryActions = Literal['create', 'create_issues', 'delete', 'invite', 'manage_issues', 'manage_jobs', 'manage_members', 'read', 'read_issues', 'read_jobs', 'update', 'view_members', 'write']
RepositoryRoles = Literal['admin', 'editor', 'maintainer', 'public_viewer', 'reader']
RepositoryOrganizationRelation = Tuple[Repository, Literal['organization'], "Organization"]
RepositoryRelations = RepositoryOrganizationRelation

@dataclass
class User:
    id: str
    type = "User"

    def __init__(self, id: typing.Any):
        self.id = str(id)

    def as_value(self) -> Value:
        return {"type": self.type, "id": self.id}
    
UserActions = typing.NoReturn
UserRoles = typing.NoReturn
UserRelations = typing.NoReturn
Resources = Union["Group", "Issue", "Organization", "Repository", "User"]
Relations = Union["GroupRelations", "IssueRelations", "OrganizationRelations", "RepositoryRelations", "UserRelations"]
class TypedRelation:
    def __init__(self, fact: Relations):
        self.fact = fact

    def as_fact(self) -> Fact:
        return {"name": "has_relation", "args": [self.fact[0].as_value(), self.fact[1], self.fact[2].as_value()]}
        

class TypedOso(Oso):
    def actions(self, actor: User, resource: Resources) -> List[str]:
        if not isinstance(resource, dict):
              resource = resource.as_value()
        return super().actions(actor.as_value(), resource)

    def authorize_group(self, actor: User, action: GroupActions, resource: Group) -> bool:
            return self.authorize(actor.as_value(), action, resource.as_value())

    def list_groups(self, actor: User, action: GroupActions) -> List[str]:
            return self.list(actor.as_value(), action, "Group")
    

    def authorize_issue(self, actor: User, action: IssueActions, resource: Issue) -> bool:
            return self.authorize(actor.as_value(), action, resource.as_value())

    def list_issues(self, actor: User, action: IssueActions) -> List[str]:
            return self.list(actor.as_value(), action, "Issue")
    

    def assign_organization_role(self, actor: User, resource: Organization, role: OrganizationRoles):
            return self.tell({"name":"has_role", "args":[actor.as_value(), role, resource.as_value()]})
    
    def authorize_organization(self, actor: User, action: OrganizationActions, resource: Organization) -> bool:
            return self.authorize(actor.as_value(), action, resource.as_value())

    def list_organizations(self, actor: User, action: OrganizationActions) -> List[str]:
            return self.list(actor.as_value(), action, "Organization")
    

    def assign_repository_role(self, actor: User, resource: Repository, role: RepositoryRoles):
            return self.tell({"name":"has_role", "args":[actor.as_value(), role, resource.as_value()]})
    
    def authorize_repository(self, actor: User, action: RepositoryActions, resource: Repository) -> bool:
            return self.authorize(actor.as_value(), action, resource.as_value())

    def list_repositorys(self, actor: User, action: RepositoryActions) -> List[str]:
            return self.list(actor.as_value(), action, "Repository")
    

    def authorize_user(self, actor: User, action: UserActions, resource: User) -> bool:
            return self.authorize(actor.as_value(), action, resource.as_value())

    def list_users(self, actor: User, action: UserActions) -> List[str]:
            return self.list(actor.as_value(), action, "User")
    
        
