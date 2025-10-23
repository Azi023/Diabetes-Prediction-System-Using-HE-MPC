# import sqlite3
# from datetime import datetime

# DB_PATH = "logs.db"

# # Initialize Database
# def init_db():
#     conn = sqlite3.connect(DB_PATH)
#     c = conn.cursor()
#     c.execute('''CREATE TABLE IF NOT EXISTS logs (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         timestamp TEXT,
#         input_hash TEXT,
#         mse REAL,
#         is_attack INTEGER
#     )''')
#     conn.commit()
#     conn.close()

# # Insert New Log
# def insert_log(input_hash, mse, is_attack):
#     conn = sqlite3.connect(DB_PATH)
#     c = conn.cursor()
#     c.execute("INSERT INTO logs (timestamp, input_hash, mse, is_attack) VALUES (?, ?, ?, ?)",
#               (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), input_hash, mse, int(is_attack)))
#     conn.commit()
#     conn.close()

# # Fetch Logs (Latest 100)
# def fetch_logs():
#     conn = sqlite3.connect(DB_PATH)
#     c = conn.cursor()
#     c.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 100")
#     rows = c.fetchall()
#     conn.close()
#     return rows


# backend/database.py
import sqlite3
from datetime import datetime

DB_PATH = "logs.db"

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # ✅ UPDATED: Added user_id column
    c.execute('''CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        input_hash TEXT,
        mse REAL,
        is_attack INTEGER,
        user_id TEXT
    )''')
    
    conn.commit()
    conn.close()
    print("✅ SQLite database initialized")

def insert_log(input_hash, mse, is_attack, user_id=None):
    """
    Insert new log entry
    
    Args:
        input_hash: Hash of input data
        mse: Mean squared error
        is_attack: Boolean if attack detected
        user_id: Optional user ID from authentication
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    c.execute(
        "INSERT INTO logs (timestamp, input_hash, mse, is_attack, user_id) VALUES (?, ?, ?, ?, ?)",
        (timestamp, input_hash, mse, int(is_attack), user_id)
    )
    
    conn.commit()
    conn.close()

def fetch_logs():
    """Fetch latest 100 logs"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, timestamp, input_hash, mse, is_attack FROM logs ORDER BY id DESC LIMIT 100")
    rows = c.fetchall()
    conn.close()
    return rows
