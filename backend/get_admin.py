import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='easyprompt_db')
cur = conn.cursor()
cur.execute("SELECT username, role FROM app_users WHERE role='admin'")
for row in cur.fetchall():
    print(row)
