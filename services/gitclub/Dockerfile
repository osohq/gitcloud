FROM python:alpine

COPY requirements.txt /app/requirements.txt

RUN \
 apk add --no-cache build-base && \
 apk add --no-cache postgresql-libs && \ 
 apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev git libffi-dev python3-dev && \
 python3 -m pip install -U pip wheel --no-cache-dir && \
 python3 -m pip install -r /app/requirements.txt --no-cache-dir && \
 apk --purge del .build-deps

COPY . /app
WORKDIR app
ENTRYPOINT [ "flask" ]
CMD [ "run", "--host", "0.0.0.0" ]