import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
app = Celery("app")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.conf.task_routes = {
    "workerapp.tasks.task1": {
        "queue": "queue1"
    },
    "workerapp.tasks.task2": {
        "queue": "queue2"
    }
}
app.autodiscover_tasks()