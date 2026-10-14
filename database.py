import sqlite3

connection = sqlite3.connect('pokemon.db')
cursor = connection.cursor()

# create_table = "CREATE TABLE berries (id INTEGER NOT NULL, userid TEXT NOT NULL, berry TEXT NOT NULL, spicy INTEGER NOT NULL, dry INTEGER NOT NULL, sweet INTEGER NOT NULL, bitter INTEGER NOT NULL, sour INTEGER NOT NULL, PRIMARY KEY (id))"

create_table = "CREATE TABLE mons (id INTEGER NOT NULL, " \
               "userid TEXT NOT NULL, " \
               "pokemon TEXT NOT NULL, " \
               "type1 TEXT NOT NULL, " \
               "type2 TEXT NOT NULL, " \
               "PRIMARY KEY (id))"

# drop_table = "DROP TABLE mons;"
cursor.execute(create_table)
connection.close()
