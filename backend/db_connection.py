import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

class Database:
    """
    A class to manage the connection to the MongoDB database.
    It fetches the connection string from environment variables.
    """
    def __init__(self):
        
        self.connection_string = os.getenv("MONGODB_CONNECTION_STRING")
        if not self.connection_string:
            print(" MONGODB_CONNECTION_STRING environment variable not set in .env file.")
            exit()
            
        self.client = None
        self.db = None
        self.connect()

    def connect(self):
        """Establishes the connection to the MongoDB database."""
        try:
            self.client = MongoClient(self.connection_string)
            self.client.admin.command('ismaster') 
            print("✅ MongoDB connection successful.")
           
            self.db = self.client.SecureHealthDB 
        except ConnectionFailure as e:
            print(f" MongoDB connection failed: {e}")
            exit()

    def get_collection(self, collection_name="patients"):
        """Returns a collection object from the database."""
        if self.db is not None:
            return self.db[collection_name]
        else:
            print(" Database not connected.")
            return None

    def close(self):
        """Closes the database connection."""
        if self.client:
            self.client.close()
            print("🔌 MongoDB connection closed.")

db_connection = Database()
