from sqlalchemy.types import Integer, String, Boolean, DateTime, JSON
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import select, func
from sqlalchemy.orm.relationships import RelationshipProperty

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True)
    email = Column(String)
    name = Column(String)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String)


class CustomRole(Base):
    __tablename__ = "custom_roles"

    id = Column(Integer, primary_key=True)
    name = Column(String)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    billing_address = Column(String)

    repos: list

    @hybrid_property
    def repository_count(self):
        return len(self.repos)

    @repository_count.expression
    def repository_count_(cls):
        return (
            select(func.count(Repository.id))
            .where(Repository.org_id == cls.id)
            .label("total_repo_count")
        )


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))
    description = Column(String(256))

    org_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    org = relationship(
        Organization, backref=backref("repos", lazy="joined"), lazy="joined"
    )

    public = Column(Boolean, default=False)
    protected = Column(Boolean, default=False)

    unique_name_in_org = UniqueConstraint(name, org_id)

    issues: list

    @hybrid_property
    def issue_count(self):
        return len(self.issues)

    @issue_count.expression
    def issue_count_(cls):
        return (
            select(func.count(Issue.id))
            .where(Issue.repo_id == cls.id)
            .label("total_issue_count")
        )


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    issue_number = Column(Integer)
    title = Column(String(256))
    closed = Column(Boolean, default=False)

    repo_id = Column(Integer, ForeignKey("repositories.id"), index=True)
    repo: Repository = relationship(Repository, backref=backref("issues"))

    creator_id = Column(String, ForeignKey("users.username"), index=True)
    creator: User = relationship(User, backref=backref("issues"))


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    username = Column(String, ForeignKey("users.username"), index=True)
    type = Column(String(256))
    data = Column(JSON)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


### Authorization Models


class RepoRole(Base):
    __tablename__ = "repo_roles"

    id = Column(Integer, primary_key=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), index=True)
    user_id = Column(String, ForeignKey("users.username"), index=True)
    role = Column(String(256))


class OrgRole(Base):
    __tablename__ = "org_roles"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    user_id = Column(String, ForeignKey("users.username"), index=True)
    role = Column(String(256))


# Creates Marshmallow schemas for all models which makes
# it easy to serialize with `as_json`
def setup_schema(base):
    for mapper in base.registry.mappers:
        class_ = mapper.class_
        if hasattr(class_, "__tablename__"):
            columns = []
            for d in mapper.all_orm_descriptors:
                # print(d.__dict__)
                # breakpoint()
                if hasattr(d, "property") and isinstance(
                    d.property, RelationshipProperty
                ):
                    continue
                if hasattr(d, "key"):
                    columns.append(d.key)
                elif hasattr(d, "__name__"):
                    columns.append(d.__name__)
                else:
                    raise Exception("Unable to find column name for %s" % d)

            print(
                "Creating schema for %s" % class_.__name__
                + " with columns %s" % columns
            )
            setattr(class_, "__columns", columns)
            setattr(
                class_,
                "as_json",
                lambda self: {c: getattr(self, c) for c in self.__class__.__columns},
            )
