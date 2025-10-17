FROM nginxinc/nginx-unprivileged:1-alpine
LABEL maintainer="Networking_app"
USER root
COPY ./default.conf.tpl /etc/nginx/default.conf.tpl
COPY ./http_proxy.params /etc/nginx/http_proxy.params
COPY ./ws_proxy.params /etc/nginx/ws_proxy.params
COPY ./uwsgi_params /etc/nginx/uwsgi_params
COPY ./run.sh /run.sh

ENV LISTEN_PORT=4500
ENV APP_HOST=backend_ea
ENV APP_PORT=9000

USER root

RUN mkdir -p /vol/static && \
    chmod 755 /vol/static && \
    touch /etc/nginx/conf.d/default.conf && \
    chown nginx:nginx /etc/nginx/conf.d/default.conf && \
    chmod +x /run.sh

VOLUME /vol/static

USER nginx

CMD ["/run.sh"]
