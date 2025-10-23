# config/db_mongo.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://AdvancedDiabetes:HCADZHxti51jNp3H@cluster0.vukfgpn.mongodb.net/AdvancedDiabetes?retryWrites=true&w=majority&appName=Cluster0')

class MongoDB:
    _client = None
    _db = None
    
    @classmethod
    def connect(cls):
        """Connect to MongoDB"""
        try:
            cls._client = MongoClient(MONGODB_URI)
            cls._db = cls._client.get_database()
            # Test connection
            cls._client.server_info()
            print(f"✅ MongoDB Connected: {cls._db.name}")
            return cls._db
        except Exception as e:
            print(f"❌ MongoDB Connection Error: {e}")
            return None
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            cls.connect()
        return cls._db

# Initialize MongoDB connection
db = MongoDB.get_db()

# Collections
users_collection = db.users if db is not None else None
