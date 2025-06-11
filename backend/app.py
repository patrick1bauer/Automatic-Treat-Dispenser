import signal
import sys
import os
import sqlite3
import pigpio
from flask import Flask, request, jsonify
from flask_cors import CORS
from time import sleep
from datetime import datetime

###################################################################################################
# Setup                                                                                           #
###################################################################################################

os.chdir(os.path.dirname(__file__))

app = Flask(__name__)
CORS(app)

# Initialize pigpio client (connects to the local daemon)
pi = pigpio.pi()
SERVO_GPIO = 15
pi.set_mode(SERVO_GPIO, pigpio.OUTPUT)

servoAngleMax = 120 # Fully open
servoAngleMin = 45 # Fully closed

###################################################################################################
# Database Setup                                                                                  #
###################################################################################################

DB_PATH = 'treat_log.db'

def get_db_connection():
    db = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db_connection()
    db.execute('''
        CREATE TABLE IF NOT EXISTS dispense_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME NOT NULL
        )
    ''')
    db.commit()
    db.close()

# Call once at startup

###################################################################################################
# Exception Catcher                                                                               #
###################################################################################################

def handle_exit(signum, frame):
    print(f"\nSignal {signum} received-cleaning up and exiting.")
    p.stop()
    GPIO.cleanup()
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

###################################################################################################
# Functions                                                                                       #
###################################################################################################

def set_servo_angle(angle):

    # Make sure the servo is within rotation limits
    if angle < servoAngleMin or angle > servoAngleMax:
        print("Invalid angle. Must be between 45° and 120°.")
        return

    pulse = int(500 + (angle / 180.0) * 2000)
    pi.set_servo_pulsewidth(SERVO_GPIO, pulse)
    sleep(0.1)
    pi.set_servo_pulsewidth(SERVO_GPIO, 0)

    print("Servo moved to angle: " + str(angle) + "°")

def release_treat():
    print("Releasing treat...")
    set_servo_angle(90)
    sleep(0.2)
    set_servo_angle(45)
    print("Treat released!")

    db = get_db_connection()
    db.execute(
        'INSERT INTO dispense_events (timestamp) VALUES (?)',
        (datetime.now(),)
    )
    db.commit()
    db.close()

@app.route('/api/servo', methods=['GET'])
def api_servo():
    result = release_treat()
    return jsonify(success=True)

@app.route('/api/history', methods=['GET'])
def api_history():
    db = get_db_connection()
    rows = db.execute(
        'SELECT id, timestamp FROM dispense_events ORDER BY timestamp DESC LIMIT 100'
    ).fetchall()
    db.close()

    # Convert rows into plain dicts (JSON serializable)
    history = [
        { 'id': row['id'], 'timestamp': row['timestamp'] }
        for row in rows
    ]
    return jsonify(history=history)

@app.route('/api/test', methods=['GET'])
def api_test():
    print("Test Successful!")
    return jsonify(success=True)

###################################################################################################
# Main                                                                                            #
###################################################################################################

if __name__ == '__main__':

    init_db()

    set_servo_angle(45)
    sleep(1)
    set_servo_angle(45)
    app.run(host='0.0.0.0', port=61002) # Robert picked this port, so if anything goes wrong blame him.
