from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "smartresolve")]
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.complaints.create_index("created_at")
    print("Connected to MongoDB")

async def close_db():
    if client:
        client.close()

def get_db():
    return db
