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

}


server {
    listen 80;
    server_name localhost;

    # Frontend SPA root
    root /usr/share/nginx/html;
    index index.html;

    # Serve SPA — try static file then fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Django static files
    location /static/ {
        alias /vol/static/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, must-revalidate";
    }

    # Media files
    location /media/ {
        alias /vol/media/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, must-revalidate";
    }

    # WebSocket proxy — rely on ws_proxy.params for Upgrade/Connection and timeouts
    location /ws/ {
        proxy_pass http://${WS_UPSTREAM};
        include /etc/nginx/ws_proxy.params;
        # do not set proxy_read_timeout here if it's already in ws_proxy.params
    }

    # Backend API proxy — rely on http_proxy.params for proxy headers/timeouts
    location ~ ^/(api|auth|admin|graphql)/ {
        proxy_pass http://${APP_UPSTREAM};
        include /etc/nginx/http_proxy.params;
        client_max_body_size 50M;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 50M;
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;
}
