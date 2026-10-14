import discord
import sqlite3
import os
from random import choice
from discord.ext.commands import Bot
from helpers import flavor_lookup, berry_lookup, versus_lookup, type_lookup, parse_type, commands_msg


# Connect to discord
bot = Bot(command_prefix='!')


@bot.event
async def on_ready():
    print(f"We have logged in as {bot.user}")


@bot.command(name='greet', help='Say hello')
async def greet(message):
    """Say hello to the user"""
    greet_msgs = ["Hello ", "Nice to see you ", "Greetings ", "Hi there ", "Welcome "]
    user_split = str(message.author).split("#", 1)
    username = user_split[0]
    await message.send(f"{choice(greet_msgs)}{username}!")


@bot.command(name='commands', help='Lists all available commands')
async def commands(message):
    """Lists all commands"""
    await message.send(commands_msg)


@bot.command(name='flavor')
async def flavor(message, berry_flavor):
    """List all berries of a particular flavor"""
    lower_flavor = berry_flavor.lower()
    flavor_data = flavor_lookup(lower_flavor)
    if "error" in flavor_data:
        await message.send("Flavor not found. Check your spelling and try again." \
            "(sour, spicy, dry, sweet, bitter)")

    # Compare with berry db
    userid = str(message.author)
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    compare_text = f"SELECT berry, {lower_flavor} FROM berries WHERE userid = ? and {lower_flavor} > 0"
    compare_check = cursor.execute(compare_text, (userid,))
    row = list(compare_check.fetchall())
    connection.close()

    # make list of berries and flavor potency
    have_berries = []
    if row:
        for i in range(len(row)):
            have_berries.append({
                "berry": row[i][0],
                "potency": row[i][1]})

    # assemble and send message
    flavor_message = ""
    flavor_message += f"**{lower_flavor.capitalize()}:** best for {flavor_data[0]} contests." + "\n"
    flavor_message += f"{lower_flavor.capitalize()} berries: {', '.join(flavor_data[1:-1])}"
    if have_berries != []:
        flavor_message += "\n\n" + "**You have:** "
        for i in range(len(have_berries)):
            flavor_message += f"{have_berries[i]['berry']}({str(have_berries[i]['potency'])}) "
    await message.send(flavor_message)


@bot.command(name='berry')
async def berry(message, berry_name):
    """Lists a berry's flavors and potencies"""
    berry_data = berry_lookup(berry_name)
    if "error" in berry_data:
        await message.send("Berry not found. Check your spelling and try again.")

    berry_message = f"Flavors for {berry_name} berry:\n"
    for i in range(len(berry_data)):
        if berry_data[i]['potency'] > 0:
            berry_message += (berry_data[i]['flavor'] + ": " + str(berry_data[i]['potency']) + "\n")
    await message.send(berry_message)


@bot.command(name='addberry', help='Save a berry to your pockets')
async def addberry(message, berry_name):
    """Add berry to database"""
    add_berry = berry_name.lower()

    # get berry flavors
    berry_flavors = berry_lookup(add_berry)
    if "error" in berry_flavors:
        await message.send("Berry not found. Check your spelling and try again.")
        
    # check db
    userid = str(message.author)
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    add_text = "SELECT * FROM berries WHERE userid = ? AND berry = ?"
    add_check = cursor.execute(add_text, (userid, add_berry))
    row = add_check.fetchone()
    connection.close()
    if row:
        await message.send("You already have that berry saved!")
        
    # add berry to db
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    mon_store = f"INSERT INTO berries (userid, berry, {berry_flavors[0]['flavor']}, {berry_flavors[1]['flavor']}, {berry_flavors[2]['flavor']}, {berry_flavors[3]['flavor']}, {berry_flavors[4]['flavor']}) VALUES(?, ?, ?, ?, ?, ?, ?)"
    add_check = cursor.execute(mon_store, (userid, add_berry, berry_flavors[0]['potency'], berry_flavors[1]['potency'], berry_flavors[2]['potency'], berry_flavors[3]['potency'], berry_flavors[4]['potency']))
    if not add_check:
        connection.close()
        await message.send("Database error.")
    connection.commit()
    connection.close()
    await message.send(f"{add_berry.capitalize()} added!")


@bot.command(name='delberry', help='Remove a berry from your pockets')
async def delberry(message, berry_name):
    """Remove berry from database"""
    del_berry = berry_name.lower()
    userid = str(message.author)

    # check db
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    del_check = "SELECT * FROM berries WHERE userid = ? AND berry = ?"
    store_check = cursor.execute(del_check, (userid, del_berry))
    row = store_check.fetchone()
    connection.close()
    if not row:
        await message.send("You don't have that berry saved!")

    # delete berry
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    del_text = "DELETE FROM berries WHERE userid = ? and berry = ?"
    del_check = cursor.execute(del_text, (userid, del_berry)) 
    if not del_check:
        connection.close()
        await message.send("Database error.")
    connection.commit()
    connection.close()
    await message.send(f"{del_berry.capitalize()} deleted!")


@bot.command(name='myberries', help='List all your saved berries')
async def myberries(message):
    """List all berries saved in database"""
    userid = str(message.author)
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    add_text = "SELECT berry FROM berries WHERE userid = ?"
    add_check = cursor.execute(add_text, (userid,))
    row = list(add_check.fetchall())
    connection.close()

    # assemble message and send
    if row:
        berries = []
        for i in range(len(row)):
            berries.append(row[i][0])
        all_berries_msg = "You have the following berries in your pockets:\n"
        all_berries_msg += ", ".join(berries)
        await message.send(all_berries_msg)
    else:
        await message.send("You don't have any berries saved yet!")


@bot.command(name='versus')
async def versus(message, mon_name):
    """Suggest types and Pokemon against input Pokemon"""
    versus_data = versus_lookup(mon_name)
    if "error" in versus_data:
        await message.send("Pokemon not found. Check your spelling and try again.")

    # remove neutral mons
    avoid_list = versus_data['avoid']
    recommend_list = versus_data['recommend']
    for item in avoid_list:
        if item in avoid_list and item in recommend_list:
            avoid_list.remove(item)
            recommend_list.remove(item)

    # remove duplicates
    avoid_set = set(avoid_list)
    recommend_set = set(recommend_list)

    # compare with pokemon db
    userid = str(message.author)
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    compare_text = "SELECT pokemon, type1, type2 FROM mons WHERE userid = ?"
    compare_check = cursor.execute(compare_text, (userid,))
    row = list(compare_check.fetchall())
    connection.close()

    # put mons in list
    recommend_mons = []
    bad_mons = []
    if row:
        for i in range(len(row)):
            types = parse_type(row[i])
            for item in types:
                if item not in avoid_set and item in recommend_set:
                    recommend_mons.append(row[i][0].capitalize())
                elif item in avoid_set:
                    bad_mons.append(row[i][0].capitalize())

        # filter out double types
        for item in bad_mons:
            if item in recommend_mons:
                recommend_mons.remove(item)
        
        # clean dupes
        recommended_mons = set(recommend_mons)

    # assemble and send formatted message
    versus_msg = f"**Versus** {mon_name.capitalize()}" + "\n**Recommend:** "
    versus_msg += ", ".join(recommend_set)
    versus_msg += "\n**Avoid:** "
    versus_msg += ", ".join(avoid_set)
    if recommend_mons != []:
        versus_msg += "\n\nPerhaps try: " + ", ".join(recommended_mons)
    await message.send(versus_msg)


@bot.command(name='addmon', help='Save a Pokemon to your pockets')
async def addmon(message, mon_name):
    """Add pokemon to database"""
    add_mon = mon_name.lower()

    # look up types
    types = type_lookup(add_mon)
    if "error" in types:
        await message.send("Pokemon not found. Please check your spelling and try again.")
    type1 = types[0]
    if len(types) == 1:
        type2 = "none"
    else:
        type2 = types[1]
        
    #check db
    userid = str(message.author)
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    add_text = "SELECT * FROM mons WHERE userid = ? AND pokemon = ?"
    add_check = cursor.execute(add_text, (userid, add_mon))
    row = add_check.fetchone()
    connection.close()
    if row:
        await message.send("You already have that Pokemon saved!")

    # add to database
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    mon_store = "INSERT INTO mons (userid, pokemon, type1, type2) VALUES(?, ?, ?, ?)"
    storeresult = cursor.execute(mon_store, (userid, add_mon, type1, type2))
    if not storeresult:
        connection.close()
        await message.send("Database error.")
    connection.commit()
    connection.close()
    await message.send(f"{add_mon.capitalize()} added!")


@bot.command(name='delmon', help='Remove a Pokemon from your pockets')
async def delmon(message, mon_name):
    """Remove Pokemon from database"""
    del_mon = mon_name.lower()
    userid = str(message.author)

    # check db
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    del_check = "SELECT * FROM mons WHERE userid = ? AND pokemon = ?"
    store_check = cursor.execute(del_check, (userid, del_mon))
    row = store_check.fetchone()
    connection.close()
    if not row:
        await message.send("You don't have that Pokemon saved!")
        
    # delete mon
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    del_text = "DELETE FROM mons WHERE userid = ? and pokemon = ?"
    del_final = cursor.execute(del_text, (userid, del_mon)) 
    if not del_final:
        connection.close()
        await message.send("Database error.")
    connection.commit()
    connection.close()
    await message.send(f"{del_mon.capitalize()} deleted!")


@bot.command(name='mymons', help="List all your saved Pokemon")
async def mymons(message):
    """Display user's saved Pokemon"""

    userid = str(message.author)
    connection = sqlite3.connect("pokemon.db")
    cursor = connection.cursor()
    add_text = "SELECT pokemon FROM mons WHERE userid = ?"
    add_check = cursor.execute(add_text, (userid,))
    row = list(add_check.fetchall())
    connection.close()

    # assemble message and send
    if row:
        user_mons = []
        for i in range(len(row)):
            user_mons.append(row[i][0].capitalize())
        all_mons_msg = "You have the following pokemon in your pockets:\n"
        all_mons_msg += ", ".join(user_mons)
        await message.send(all_mons_msg)
    else:
        await message.send("You don't have any Pokemon saved yet!")


TOKEN = os.environ.get("DISCORD_API")
bot.run(TOKEN)
