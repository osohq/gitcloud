# start with a minimal image
FROM debian:bookworm-slim

# get base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# create the runtime environment for the app
RUN useradd -ms /bin/bash app
RUN mkdir -p /app && chown app:app /app

# create data directory
RUN mkdir -p /data && chown app:app /data

USER app

RUN curl -L https://cloud.osohq.com/install.sh | bash
RUN echo "export PATH=$HOME/.local/bin:$PATH" >> ~/.bashrc

WORKDIR /app

# copy the release build
COPY oso-standalone-linux /app/standalone
COPY facts.yml /app/facts.yml

ENV OSO_DIRECTORY=/data
ENV OSO_PORT=8081
ENV OSO_FEATURES="reconcile-facts-update"

CMD ["/app/standalone"]
