from typing import Dict, Final

# Region Mapping
PLATFORM_ROUTING: Final[Dict[str, str]] = {
    "na1": "americas",
    "br1": "americas",
    "la1": "americas",
    "la2": "americas",
    "kr": "asia",
    "jp1": "asia",
    "euw1": "europe",
    "eun1": "europe",
    "tr1": "europe",
    "ru": "europe",
    "oc1": "sea",
    "ph2": "sea",
    "sg2": "sea",
    "th2": "sea",
    "tw2": "sea",
    "vn2": "sea",
}

# Queue Configuration
QUEUE_IDS: Final[Dict[int, str]] = {
    420: "RANKED_SOLO_5x5",
    440: "RANKED_FLEX_SR",
    450: "ARAM",
    400: "NORMAL_DRAFT_PICK",
    430: "NORMAL_BLIND_PICK",
}

# Limited static mapping for demo. In production, fetch from DataDragon.
CHAMPION_ID_MAP: Final[Dict[int, str]] = {
    1: "Annie",
    2: "Olaf",
    3: "Galio",
    4: "TwistedFate",
    5: "XinZhao",
    6: "Urgot",
    7: "LeBlanc",
    8: "Vladimir",
    9: "Fiddlesticks",
    10: "Kayle",
    11: "MasterYi",
    12: "Alistar",
    13: "Ryze",
    14: "Sion",
    15: "Sivir",
    16: "Soraka",
    17: "Teemo",
    18: "Tristana",
    19: "Warwick",
    20: "Nunu",
    21: "MissFortune",
    22: "Ashe",
    23: "Tryndamere",
    24: "Jax",
    25: "Morgana",
    26: "Zilean",
    27: "Singed",
    28: "Evelynn",
    29: "Twitch",
    30: "Karthus",
    81: "Ezreal",
    412: "Thresh",
    236: "Lucian",
    222: "Jinx",
    64: "LeeSin",
    157: "Yasuo",
    238: "Zed",
    202: "Jhin",
    145: "KaiSa",
    235: "Senna",
    555: "Pyke",
    777: "Yone",
}

def get_platform_from_region(region: str) -> str:
    """Returns the routing platform (americas, europe, etc.) for a given region (na1, euw1)."""
    return PLATFORM_ROUTING.get(region.lower(), "americas")
