from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "smart-resolve")

    is_atlas = "mongodb+srv" in mongo_url or "mongodb.net" in mongo_url
    kwargs = {"serverSelectionTimeoutMS": 5000}
    if is_atlas:
        kwargs["tlsAllowInvalidCertificates"] = True

    client = AsyncIOMotorClient(mongo_url, **kwargs)
    db = client[db_name]
    try:
        await db.users.create_index("email", unique=True)
        await db.complaints.create_index("created_at")
        print(f"Connected to MongoDB: {db_name}")
    except Exception as e:
        print(f"Warning: MongoDB index creation failed: {e}")

async def close_db():
    if client:
        client.close()

def get_db():
    return db
