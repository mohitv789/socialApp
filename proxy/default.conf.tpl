server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location /static {
        alias /vol/static;
    }

    location / {
        uwsgi_pass ${APP_HOST}:${APP_PORT};
        include /etc/nginx/uwsgi_params;
        client_max_body_size 50M;
        include /etc/nginx/http_proxy.params;
    }
    
    

    location /ws/ {
        proxy_pass http://websockets:8080;
        include /etc/nginx/ws_proxy.params;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|jpeg|png|gif|ico|svg|woff2?|ttf|eot)$ {
        expires 30d;
        access_log off;
    }

}
