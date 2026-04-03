import MySQLdb
import os

try:
    conn = MySQLdb.connect(
        host=os.environ.get('DB_HOST', 'host.docker.internal'),
        user=os.environ.get('DB_USER', 'hotel_user'),
        passwd=os.environ.get('DB_PASSWORD', 'HotelSecurePass2024!'),
        port=int(os.environ.get('DB_PORT', '3306'))
    )
    cursor = conn.cursor()
    cursor.execute("DROP DATABASE IF EXISTS hotel_management")
    cursor.execute("CREATE DATABASE hotel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cursor.close()
    conn.commit()
    conn.close()
    print("Database reset successfully.")
except Exception as e:
    print(f"Error: {e}")
