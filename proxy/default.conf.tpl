server {
    listen 80;
    server_name localhost;

    location /static {
        alias /vol/static;
    }
    
    location / {
        proxy_pass http://${APP_UPSTREAM};
        include /etc/nginx/http_proxy.params;
        client_max_body_size 50M;
    }

    location /ws/ {
        proxy_pass http://websockets:8080;
        include /etc/nginx/ws_proxy.params;
    }

}
