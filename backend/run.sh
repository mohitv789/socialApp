# #!/bin/sh

# set -e

# python manage.py wait_for_db
# python manage.py migrate

# uwsgi --socket :9000 --workers 4 --master --enable-threads --module app.wsgi

#!/bin/sh

set -e

# Wait for DB (your manage.py wait_for_db must exist and be reliable)
python manage.py wait_for_db

# Run migrations
python manage.py collectstatic --noinput --clear
python manage.py migrate --noinput

# Collect static optionally (uncomment if you use)
# python manage.py collectstatic --noinput

# Start uWSGI
# - Prevents exec/sh spawn: exec so PID 1 is uwsgi (signal handling)
exec uwsgi --socket :9000 --workers 4 --master --enable-threads --module app.wsgi
