# routes/auth.py
from flask import Blueprint, request, jsonify
from models_auth.user import User
from utils.auth import generate_token, token_required
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['email', 'username', 'password', 'firstName', 'lastName', 'role']
        for field in required:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        email = data['email']
        username = data['username']
        password = data['password']
        first_name = data['firstName']
        last_name = data['lastName']
        role = data['role']
        
        # Validate email
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate username length
        if len(username) < 3:
            return jsonify({
                'success': False,
                'message': 'Username must be at least 3 characters'
            }), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 6 characters'
            }), 400
        
        # Validate role
        if role not in ['admin', 'patient', 'hospital']:
            return jsonify({
                'success': False,
                'message': 'Invalid role. Must be "admin" or "patient", or "hospital"'
            }), 400
        
        # Check if user exists
        if User.user_exists(email=email):
            return jsonify({
                'success': False,
                'message': 'User with this email already exists'
            }), 400
        
        if User.user_exists(username=username):
            return jsonify({
                'success': False,
                'message': 'Username already taken'
            }), 400
        
        # Create user
        user_id = User.create_user(email, username, password, first_name, last_name, role)
        user = User.find_by_id(user_id)
        token = generate_token(user_id)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'token': token,
            'user': User.to_dict(user)
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error during registration'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        email = data['email']
        password = data['password']
        
        # Find user
        user = User.find_by_email(email)
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
        
        # Check if active
        if not user.get('isActive', True):
            return jsonify({
                'success': False,
                'message': 'Account is deactivated'
            }), 401
        
        # Verify password
        if not User.verify_password(password, user['password']):
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
        
        # Update last login
        User.update_last_login(user['_id'])
        
        # Generate token
        token = generate_token(user['_id'])
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': User.to_dict(user)
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error during login'
        }), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user(current_user):
    """Get current logged in user"""
    try:
        return jsonify({
            'success': True,
            'user': User.to_dict(current_user)
        }), 200
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout(current_user):
    """Logout user"""
    try:
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error'
        }), 500