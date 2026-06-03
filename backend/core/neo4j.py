from neo4j import AsyncGraphDatabase
from core.config import settings

driver = None


async def get_neo4j():
    global driver
    if driver is None:
        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return driver


async def close_neo4j():
    global driver
    if driver:
        await driver.close()
        driver = None
