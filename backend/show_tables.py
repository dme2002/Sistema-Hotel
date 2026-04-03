import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_management.settings")
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print("TABLES:", tables)
