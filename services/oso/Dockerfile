# start with a minimal image
FROM debian:bookworm-slim

# get base dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# create the runtime environment for the app
RUN useradd -ms /bin/bash app
RUN mkdir -p /app && chown app:app /app

# create data directory
RUN mkdir -p /data && chown app:app /data

USER app
WORKDIR /app

# copy the release build
COPY oso-standalone-linux /app/standalone

ENV OSO_DIRECTORY=/data
ENV OSO_PORT=8081

CMD ["/app/standalone"]
