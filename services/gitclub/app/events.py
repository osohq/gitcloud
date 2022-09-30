from .models import Event
from flask import g


def event(name: str, data: dict) -> Event:
    username = g.current_user.username if g.current_user else None
    event = Event(
        type=name,
        username=username,
        data=data,
    )
    g.session.add(event)
    g.session.commit()
    return event
