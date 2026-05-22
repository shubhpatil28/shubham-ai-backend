import sqlite3
import datetime
from config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Memory Table (Stores user goals, projects, facts)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS memory (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    
    # 2. Daily Tasks / Planner Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            date TEXT NOT NULL,
            scheduled_time TEXT,
            priority TEXT DEFAULT 'medium'
        )
    """)
    
    # 3. Chat History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 4. Contact Memory Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contact_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT UNIQUE NOT NULL,
            contact_name TEXT NOT NULL
        )
    """)

    # 5. Scheduled Messages Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT NOT NULL,
            message TEXT NOT NULL,
            scheduled_time DATETIME NOT NULL,
            status TEXT DEFAULT 'pending',
            file_path TEXT
        )
    """)
    
    conn.commit()
    conn.close()

# --- Memory Helpers ---
def save_memory_fact(key, value):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO memory (key, value)
        VALUES (?, ?)
    """, (key, value))
    conn.commit()
    conn.close()

def get_memory_fact(key):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM memory WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row['value'] if row else None

def get_all_memory():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM memory")
    rows = cursor.fetchall()
    conn.close()
    return {row['key']: row['value'] for row in rows}

# --- Tasks Helpers ---
def add_task(title, date=None, scheduled_time=None, priority='medium'):
    if not date:
        date = datetime.date.today().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, status, date, scheduled_time, priority)
        VALUES (?, 'pending', ?, ?, ?)
    """, (title, date, scheduled_time, priority))
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return task_id

def get_tasks(date=None):
    if not date:
        date = datetime.date.today().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, status, date, scheduled_time, priority FROM tasks WHERE date = ? ORDER BY scheduled_time ASC", (date,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_task_status(task_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
    conn.commit()
    conn.close()

def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()

# --- Chat History Helpers ---
def add_chat_log(sender, message):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_history (sender, message) VALUES (?, ?)", (sender, message))
    conn.commit()
    conn.close()

def get_chat_history(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT sender, message, timestamp FROM chat_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    # Return in chronological order
    return [dict(row) for row in reversed(rows)]

# --- Contact Memory Helpers ---
def save_contact(nickname, contact_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO contact_memory (nickname, contact_name)
        VALUES (?, ?)
    """, (nickname.lower().strip(), contact_name.strip()))
    conn.commit()
    conn.close()

def delete_contact(contact_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contact_memory WHERE id = ?", (contact_id,))
    conn.commit()
    conn.close()

def get_contact_by_nickname(nickname):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT contact_name FROM contact_memory WHERE nickname = ?", (nickname.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    return row['contact_name'] if row else None

def get_all_contacts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nickname, contact_name FROM contact_memory ORDER BY nickname ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- Scheduled Messages Helpers ---
def add_scheduled_message(recipient, message, scheduled_time, file_path=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scheduled_messages (recipient, message, scheduled_time, status, file_path)
        VALUES (?, ?, ?, 'pending', ?)
    """, (recipient.strip(), message.strip(), scheduled_time, file_path))
    conn.commit()
    sched_id = cursor.lastrowid
    conn.close()
    return sched_id

def get_pending_schedules(current_time):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, recipient, message, scheduled_time, file_path 
        FROM scheduled_messages 
        WHERE status = 'pending' AND scheduled_time <= ?
    """, (current_time,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_schedule_status(schedule_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE scheduled_messages SET status = ? WHERE id = ?", (status, schedule_id))
    conn.commit()
    conn.close()

def get_all_schedules():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, recipient, message, scheduled_time, status, file_path FROM scheduled_messages ORDER BY scheduled_time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_schedule(schedule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scheduled_messages WHERE id = ?", (schedule_id,))
    conn.commit()
    conn.close()

# Initialize DB on load
init_db()
