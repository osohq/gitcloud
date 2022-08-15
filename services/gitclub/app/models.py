from sqlalchemy.types import Integer, String, Boolean
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base

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

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    org_id = Column(Integer, ForeignKey("organizations.id"))
    org = relationship(Organization, backref=backref("repos", lazy=False), lazy=False)

    unique_name_in_org = UniqueConstraint(name, org_id)

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    issue_number = Column(Integer)
    title = Column(String(256))
    closed = Column(Boolean, default=False)

    repo_id = Column(Integer, ForeignKey("repositories.id"))
    repo = relationship(Repository, backref=backref("issues", lazy=False), lazy=False)

    creator_id = Column(String, ForeignKey("users.username"))
    creator = relationship(User, backref=backref("issues", lazy=False), lazy=False)


# Creates Marshmallow schemas for all models which makes
# it easy to serialize with `as_json`
def setup_schema(base):
    for mapper in base.registry.mappers:
        class_ = mapper.class_
        if hasattr(class_, "__tablename__"):
            columns = list(c.name for c in mapper.columns)
            setattr(class_, "__columns", columns)
            setattr(class_, "as_json", lambda self: {c: getattr(self, c) for c in self.__class__.__columns})



