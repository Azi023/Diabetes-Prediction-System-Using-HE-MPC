from config.db_mongo import MongoDB
from dotenv import load_dotenv

load_dotenv()

print("Testing MongoDB connection...")
db = MongoDB.get_db()

if db is not None:
    print("✅ MongoDB Connected!")
    print(f"Database: {db.name}")
else:
    print("❌ MongoDB Connection Failed!")
