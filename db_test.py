import sqlite3

connection = sqlite3.connect("pokemon.db")
cursor = connection.cursor()
cursor.execute("SELECT * FROM mons")
row = cursor.fetchall()
connection.close()
for item in row:
    print(item)