from typing import Type, cast
from sqlalchemy.types import Integer, String, Boolean, DateTime, JSON
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref, DeclarativeMeta, column_property
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import select, func
from sqlalchemy.sql.functions import concat
from sqlalchemy.orm.relationships import RelationshipProperty

Base: Type = declarative_base()


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    issue_number = Column(Integer)
    title = Column(String(256))
    closed = Column(Boolean, default=False)

    repo_id = Column(Integer, index=True)
    creator_id = Column(String, index=True)


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
