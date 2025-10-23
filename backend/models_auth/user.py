# models_auth/user.py
import bcrypt
from datetime import datetime
from bson import ObjectId
from config.db_mongo import users_collection

class User:
    """User model for authentication"""
    
    @staticmethod
    def create_user(email, username, password, first_name, last_name, role='patient'):
        """Create a new user with hashed password"""
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_data = {
            'email': email.lower().strip(),
            'username': username.strip(),
            'password': password_hash,
            'firstName': first_name.strip(),
            'lastName': last_name.strip(),
            'role': role,
            'isActive': True,
            'createdAt': datetime.utcnow(),
            'lastLogin': None
        }
        
        result = users_collection.insert_one(user_data)
        return result.inserted_id
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        return users_collection.find_one({'email': email.lower().strip()})
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        try:
            return users_collection.find_one({'_id': ObjectId(user_id)})
        except:
            return None
    
    @staticmethod
    def verify_password(plain_password, hashed_password):
        """Verify password against hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
    
    @staticmethod
    def update_last_login(user_id):
        """Update last login timestamp"""
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'lastLogin': datetime.utcnow()}}
        )
    
    @staticmethod
    def user_exists(email=None, username=None):
        """Check if user exists"""
        query = {}
        if email:
            query['email'] = email.lower().strip()
        if username:
            query['username'] = username.strip()
        
        if query:
            return users_collection.find_one(query) is not None
        return False
    
    @staticmethod
    def to_dict(user_doc):
        """Convert MongoDB document to dict (remove password)"""
        if not user_doc:
            return None
        
        return {
            'id': str(user_doc['_id']),
            'email': user_doc['email'],
            'username': user_doc['username'],
            'firstName': user_doc['firstName'],
            'lastName': user_doc['lastName'],
            'role': user_doc['role'],
            'isActive': user_doc.get('isActive', True),
            'createdAt': user_doc.get('createdAt'),
            'lastLogin': user_doc.get('lastLogin')
        }