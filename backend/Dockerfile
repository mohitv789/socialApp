# Use official Python Alpine image (you can change to -slim if preferred)
FROM python:3.12-alpine

ENV PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1

# ensure reliable Alpine repos and small retry loop for transient mirror issues
RUN printf "https://dl-cdn.alpinelinux.org/alpine/v3.22/main\nhttps://dl-cdn.alpinelinux.org/alpine/v3.22/community\n" > /etc/apk/repositories \
 && for i in 1 2 3; do apk update && break || sleep 2; done

# create app dir early, copy requirements first (leverage cache)
RUN mkdir -p /app /vol/web/static /vol/web/media
WORKDIR /app

COPY ./requirements.txt /requirements.txt
COPY ./run.sh /run.sh
COPY ./app /app

# Install runtime packages (client/tools) and build deps in a single flow
# Use a virtual .build-deps package so we can remove heavy build deps afterwards
RUN apk add --no-cache --virtual .run-deps \
      libjpeg-turbo \
      libstdc++ \
      openblas \
      libgfortran \
      postgresql-client || true \
 && apk add --no-cache --virtual .build-deps \
      build-base \
      musl-dev \
      linux-headers \
      gfortran \
      zlib-dev \
      libffi-dev \
      postgresql-dev \
      bash \
      curl \
      lapack-dev \
      openblas-dev \
 && python -m pip install --upgrade pip setuptools wheel \
 && pip --default-timeout=60 --retries=10 install --no-cache-dir -r /requirements.txt \
 && apk del .build-deps \
 && rm -rf /var/cache/apk/* /root/.cache/pip

# make run.sh executable and set permissions for volumes
RUN chmod +x /run.sh \
 && chown -R root:root /app /vol/web \
 && chmod -R 755 /vol/web

EXPOSE 8000

# Use a non-root user if desired (uncomment to enable)
# RUN addgroup -S web && adduser -S web -G web
# USER web

CMD ["/run.sh"]


