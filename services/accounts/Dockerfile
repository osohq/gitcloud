FROM python:alpine

COPY requirements.txt /app/requirements.txt
RUN \
 apk add --no-cache postgresql-libs && \
 apk add --no-cache --virtual .build-deps gcc g++ musl-dev postgresql-dev git && \
 python3 -m pip install gunicorn && \
 python3 -m pip install -r /app/requirements.txt --no-cache-dir && \
 apk --purge del .build-deps

COPY oso_cloud-1.3.3-py3-none-any.whl .
RUN pip install oso_cloud-1.3.3-py3-none-any.whl

COPY . /app
WORKDIR /app
ENTRYPOINT [ "gunicorn" ]
CMD [ "-b", ":5000", "-w", "2", "app:create_app()"]