# Dockerfile.slim (recommended)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
RUN mkdir -p /app /vol/web/static /vol/web/media

# Install small system deps for Pillow/psycopg2/etc.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    libpq-dev \
    curl \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# copy requirements first to leverage caching
COPY ./requirements.txt /tmp/requirements.txt

# upgrade pip & install deps, prefer wheels
RUN python -m pip install --upgrade pip setuptools wheel \
 && /bin/sh -c 'for i in 1 2 3; do pip --default-timeout=120 --retries=10 install --prefer-binary -r /tmp/requirements.txt && break || sleep 3; done' \
 && rm -f /tmp/requirements.txt

# copy app and run script
COPY ./app /app
COPY ./run.sh /run.sh

RUN chmod +x /run.sh \
 && chown -R root:root /app /vol/web \
 && chmod -R 755 /vol/web

EXPOSE 9000

# Optionally switch to non-root user here
# RUN addgroup --system web && adduser --system --ingroup web web
# USER web

CMD ["/run.sh"]
