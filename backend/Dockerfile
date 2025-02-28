FROM amd64/python:3.8-alpine
ENV PYTHONUNBUFFERED 1

RUN mkdir /app
COPY ./requirements.txt /requirements.txt
COPY ./run.sh /run.sh
COPY ./app /app
WORKDIR /app
EXPOSE 8000

RUN apk add --update --no-cache postgresql-client jpeg-dev
RUN apk add --update --no-cache --virtual .tmp-build-deps \
      gcc libc-dev linux-headers postgresql-dev musl-dev zlib zlib-dev linux-headers libffi-dev
RUN apk add --no-cache build-base abuild bash curl gfortran libstdc++ lapack-dev openblas-dev
RUN pip install --upgrade pip
RUN pip install -r /requirements.txt
RUN apk del .tmp-build-deps
RUN mkdir -p /vol/web/media
RUN mkdir -p /vol/web/static
RUN chmod -R 755 /vol/web
RUN chmod +x /run.sh