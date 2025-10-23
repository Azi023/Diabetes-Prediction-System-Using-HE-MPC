#!/usr/bin/env python3
# create_system_users.py - Script to create admin and hospital users

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models_auth.user import User
from datetime import datetime

def create_system_users():
    """Create predefined admin and hospital users"""
    
    # Admin user credentials
    admin_data = {
        'email': 'admin@medguard.com',
        'username': 'admin',
        'password': 'SecureAdmin123!',  # Change this to a strong password
        'firstName': 'System',
        'lastName': 'Administrator',
        'role': 'admin'
    }
    
    # Hospital user credentials  
    hospital_data = {
        'email': 'hospital@medguard.com',
        'username': 'hospital',
        'password': 'SecureHospital123!',  # Change this to a strong password
        'firstName': 'Hospital',
        'lastName': 'System',
        'role': 'hospital'
    }
    
    try:
        # Create admin user
        if not User.user_exists(email=admin_data['email']):
            admin_id = User.create_user(
                admin_data['email'],
                admin_data['username'], 
                admin_data['password'],
                admin_data['firstName'],
                admin_data['lastName'],
                admin_data['role']
            )
            print(f"✅ Admin user created successfully with ID: {admin_id}")
            print(f"   Email: {admin_data['email']}")
            print(f"   Password: {admin_data['password']}")
        else:
            print("⚠️  Admin user already exists")
        
        # Create hospital user
        if not User.user_exists(email=hospital_data['email']):
            hospital_id = User.create_user(
                hospital_data['email'],
                hospital_data['username'],
                hospital_data['password'], 
                hospital_data['firstName'],
                hospital_data['lastName'],
                hospital_data['role']
            )
            print(f"✅ Hospital user created successfully with ID: {hospital_id}")
            print(f"   Email: {hospital_data['email']}")
            print(f"   Password: {hospital_data['password']}")
        else:
            print("⚠️  Hospital user already exists")
            
        print("\n🔐 IMPORTANT: Change the default passwords after first login!")
        print("📧 Login credentials saved. Share hospital credentials with authorized hospital staff only.")
        
    except Exception as e:
        print(f"❌ Error creating system users: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Creating system users (Admin & Hospital)...")
    print("=" * 50)
    
    success = create_system_users()
    
    if success:
        print("\n✅ System users created successfully!")
        print("\nNext steps:")
        print("1. Save the login credentials securely")
        print("2. Change default passwords after first login")
        print("3. Share hospital credentials with authorized staff only")
    else:
        print("\n❌ Failed to create system users")
        sys.exit(1)