from sys import breakpointhook
from sqlalchemy.types import Integer, String, Boolean
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True)
    email = Column(String)
    name = Column(String)

    # class Meta:


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String)

    __tablename__ = "custom_roles"

    id = Column(Integer, primary_key=True)
    email = Column(String)
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
        # breakpoint()
        if hasattr(class_, "__tablename__"):
            class Meta(object):
                model = class_

            meta_class = getattr(class_, "Meta", Meta)
            schema_class_name = "%sSchema" % class_.__name__

            schema_class = type(
                schema_class_name, (SQLAlchemyAutoSchema,), {"Meta": meta_class}
            )

            instance = schema_class()

            def as_json(self):
                return instance.dump(self)

            setattr(class_, "as_json", as_json)


