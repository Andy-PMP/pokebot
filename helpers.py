import requests

def flavor_lookup(berry_flavor):
    """Input berry flavor, returns list of berries with that flavor"""
    try:
        url = f"https://pokeapi.co/api/v2/berry-flavor/{berry_flavor}/"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return "API error"

    # parse response
    try:
        flavor_info = response.json()
        berries = [flavor_info["contest_type"]["name"]]
        for i in range(len(flavor_info["berries"])):
            berries.append(flavor_info["berries"][i]["berry"]["name"])
        return berries
    except (KeyError, TypeError, ValueError):
        return "JSON error"


def berry_lookup(berry):
    """Input berry, returns list of dicts of that berry's flavors and potencies"""
    try:
        url = f"https://pokeapi.co/api/v2/berry/{berry}/"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return "API error"

    # parse response
    try:
        berry_info = response.json()
        flavors = []
        for i in range(len(berry_info["flavors"])):
            flavors.append({
                "flavor": berry_info["flavors"][i]["flavor"]["name"],
                "potency": berry_info["flavors"][i]["potency"]})
        return flavors
    except (KeyError, TypeError, ValueError):
        return "JSON error"


def versus_lookup(mon):
    """Input pokemon, return dictionary of recommend/avoid mons"""
    try:
        url = f"https://pokeapi.co/api/v2/pokemon/{mon}/"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return "API error"

    # parse response
    try:
        mon_info = response.json()
        type_info = []
        for i in range(len(mon_info['types'])):
            type_info.append(mon_info['types'][i]['type']['name'])

        # single type pokemon
        try:
            url = f"https://pokeapi.co/api/v2/type/{type_info[0]}/"
            response = requests.get(url)
            response.raise_for_status()
        except requests.RequestException:
            return "API error"
        # parse response
        try:
            versus_info = response.json()
            versus_msg = {"avoid": [],
                          "recommend": []}
            for i in range(len(versus_info['damage_relations']['double_damage_to'])):
                versus_msg['avoid'] += [versus_info['damage_relations']['double_damage_to'][i]['name']]
            for i in range(len(versus_info['damage_relations']['double_damage_from'])):
                versus_msg["recommend"] += [versus_info['damage_relations']['double_damage_from'][i]['name']]
            if len(type_info) == 1:
                return versus_msg
            else:
                # dual type pokemon, look up 2nd type
                try:
                    url = f"https://pokeapi.co/api/v2/type/{type_info[1]}/"
                    response = requests.get(url)
                    response.raise_for_status()
                except requests.RequestException:
                    return "API error"

                # parse response
                try:
                    versus_info2 = response.json()
                    for i in range(len(versus_info2['damage_relations']['double_damage_to'])):
                        versus_msg['avoid'] += [versus_info2['damage_relations']['double_damage_to'][i]['name']]
                    for i in range(len(versus_info2['damage_relations']['double_damage_from'])):
                        versus_msg["recommend"] += [versus_info2['damage_relations']['double_damage_from'][i]['name']]
                    return versus_msg
                except (KeyError, TypeError, ValueError):
                    return "JSON error"

        except (KeyError, TypeError, ValueError):
            return "JSON error"

    except (KeyError, TypeError, ValueError):
        return "JSON error"



def type_lookup(mon):
    """Input pokemon, return list of types"""
    try:
        url = f"https://pokeapi.co/api/v2/pokemon/{mon}/"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return "API error"

    # parse response
    try:
        mon_info = response.json()
        type_info = []
        for i in range(len(mon_info['types'])):
            type_info.append(mon_info['types'][i]['type']['name'])
        return type_info
    except (KeyError, TypeError, ValueError):
        return "JSON error"


def parse_type(type_data):
    """parses database output, returns list of types"""
    try:
        new_data = []
        new_data.append(type_data[1])
        if type_data[2] != "none":
            new_data.append(type_data[2])
        return new_data
    except (KeyError, TypeError, ValueError):
        return "Parsing error"


commands_msg = "Welcome to Pokebot!\nPokeBot Commands:\n\n!greet: say hello\n\n"\
    "**Berry commands:**\n!berry <berry>: Look up a berry's flavors\n"\
    "!flavor <flavor>: List berries of a particular flavor (spicy, sour, dry, sweet, bitter)\n"\
    "!addberry <berry>: Add a berry to your pockets to be recommended with !flavor command\n"\
    "!delberry <berry>: Remove a berry from your pockets\n"\
    "!myberries: List all the berries you have saved in your pockets.\n\n"\
    "**Pokemon commands:**\n"\
    "!versus <pokemon>: Get recommended types for going againt a certain Pokemon\n"\
    "!addmon <pokemon>: Add Pokemon to your pockets to be recommended with !versus command\n"\
    "!delmon <pokemon>: Delete a Pokemon from your pockets\n"\
    "!mymons: List all the Pokemon you have saved in your pockets"
