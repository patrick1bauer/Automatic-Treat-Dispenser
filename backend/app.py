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
# Starting Variables                                                                              #
###################################################################################################

SERVO_GPIO = 15 # GPIO pin connected to the servo signal wire

servoAngleMax = 120 # Fully open
servoAngleMin = 45 # Fully closed

servoAngleOpen = 90 # Angle to open the treat dispenser
servoAngleClosed = 45 # Angle to close the treat dispenser

servoOpenDuration = 0.2 # Duration to keep the servo open (in seconds)

###################################################################################################
# Setup                                                                                           #
###################################################################################################

SIMULATE_MODE = os.getenv("PIGPIO_SIMULATE", "0") == "1"

os.chdir(os.path.dirname(__file__))

app = Flask(__name__)
CORS(app)

# Initialize pigpio client (connects to the local daemon)
pi = None
if SIMULATE_MODE:
    print("PIGPIO_SIMULATE=1: running without hardware GPIO")
else:
    pi = pigpio.pi()
    if not pi.connected:
        raise RuntimeError("Unable to connect to pigpio daemon. Start pigpiod or set PIGPIO_SIMULATE=1.")

if pi is not None:
    pi.set_mode(SERVO_GPIO, pigpio.OUTPUT)

###################################################################################################
# Database Setup & Functions                                                                      #
###################################################################################################

DB_PATH = os.getenv('DB_PATH', os.path.join('/app', 'automatic_treat_dispenser.db'))

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

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
    db.execute('''
        CREATE TABLE IF NOT EXISTS servo_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value INTEGER NOT NULL
        )
    ''')
    db.commit()
    db.close()
    if get_servo_setting('servoAngleMax') is None:
        set_servo_setting('servoAngleMax', servoAngleMax)
    if get_servo_setting('servoAngleMin') is None:
        set_servo_setting('servoAngleMin', servoAngleMin)
    if get_servo_setting('servoAngleOpen') is None:
        set_servo_setting('servoAngleOpen', servoAngleOpen)
    if get_servo_setting('servoAngleClosed') is None:
        set_servo_setting('servoAngleClosed', servoAngleClosed)
    if get_servo_setting('servoOpenDuration') is None:
        set_servo_setting('servoOpenDuration', servoOpenDuration)

def get_servo_setting(key):
    db = get_db_connection()
    row = db.execute('SELECT value FROM servo_settings WHERE key = ?', (key,)).fetchone()
    db.close()
    return row['value'] if row else None

def set_servo_setting(key, value):
    db = get_db_connection()
    db.execute('INSERT OR REPLACE INTO servo_settings (key, value) VALUES (?, ?)', (key, value))
    db.commit()
    db.close()

###################################################################################################
# Exception Catcher                                                                               #
###################################################################################################

def handle_exit(signum, frame):
    print(f"\nSignal {signum} received-cleaning up and exiting.")
    if pi is not None:
        pi.stop()
    sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

###################################################################################################
# Functions                                                                                       #
###################################################################################################

def set_servo_angle(angle):

    # Make sure the servo is within rotation limits
    if angle < get_servo_setting('servoAngleMin') or angle > get_servo_setting('servoAngleMax'):
        print("Invalid angle. Must be between " + str(get_servo_setting('servoAngleMin')) + "° and " + str(get_servo_setting('servoAngleMax')) + "°.")
        return

    if pi is None:
        print(f"SIMULATED: servo angle set to {angle}°")
        return

    pulse = int(500 + (angle / 180.0) * 2000)
    pi.set_servo_pulsewidth(SERVO_GPIO, pulse)
    sleep(0.1)
    pi.set_servo_pulsewidth(SERVO_GPIO, 0)

    print("Servo moved to angle: " + str(angle) + "°")

def release_treat():
    print("Releasing treat...")
    set_servo_angle(get_servo_setting('servoAngleOpen'))
    sleep(get_servo_setting('servoOpenDuration'))
    set_servo_angle(get_servo_setting('servoAngleClosed'))
    print("Treat released!")

    db = get_db_connection()
    db.execute(
        'INSERT INTO dispense_events (timestamp) VALUES (?)',
        (datetime.now(),)
    )
    db.commit()
    db.close()

###################################################################################################
# Endpoints                                                                                       #
###################################################################################################

@app.route('/api/post/releaseTreat', methods=['POST'])
def api_post_release_treat():
    result = release_treat()
    return jsonify(success=True)

@app.route('/api/get/history', methods=['GET'])
def api_get_history():
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

@app.route('/api/get/servoAngleOpen', methods=['GET'])
def api_get_servo_angle_open():
    servoAngleOpen = get_servo_setting('servoAngleOpen')
    return jsonify(servoAngleOpen=servoAngleOpen)

@app.route('/api/put/servoAngleOpen', methods=['PUT'])
def api_put_servo_angle_open():
    data = request.get_json()
    if 'servoAngleOpen' in data:
        set_servo_setting('servoAngleOpen', data['servoAngleOpen'])
        return jsonify(success=True)
    else:
        return jsonify(success=False, error="Missing 'servoAngleOpen' in request body"), 400

@app.route('/api/get/servoAngleClosed', methods=['GET'])
def api_get_servo_angle_closed():
    servoAngleClosed = get_servo_setting('servoAngleClosed')
    return jsonify(servoAngleClosed=servoAngleClosed)

@app.route('/api/put/servoAngleClosed', methods=['PUT'])
def api_put_servo_angle_closed():
    data = request.get_json()
    if 'servoAngleClosed' in data:
        set_servo_setting('servoAngleClosed', data['servoAngleClosed'])
        return jsonify(success=True)
    else:
        return jsonify(success=False, error="Missing 'servoAngleClosed' in request body"), 400

@app.route('/api/get/servoOpenDuration', methods=['GET'])
def api_get_servo_open_duration():
    servoOpenDuration = get_servo_setting('servoOpenDuration')
    return jsonify(servoOpenDuration=servoOpenDuration)

@app.route('/api/put/servoOpenDuration', methods=['PUT'])
def api_put_servo_open_duration():
    data = request.get_json()
    if 'servoOpenDuration' in data:
        set_servo_setting('servoOpenDuration', data['servoOpenDuration'])
        return jsonify(success=True)
    else:
        return jsonify(success=False, error="Missing 'servoOpenDuration' in request body"), 400

@app.route('/api/get/test', methods=['GET'])
def api_get_test():
    print("Test Successful!")
    return jsonify(success=True)

###################################################################################################
# Main                                                                                            #
###################################################################################################

if __name__ == '__main__':
    # Initialize the database
    init_db()

    # Ensure the servo starts in the closed position
    set_servo_angle(get_servo_setting('servoAngleClosed'))
    sleep(1)
    set_servo_angle(get_servo_setting('servoAngleClosed'))

    # Start the application
    app.run(host='0.0.0.0', port=61002) # Robert picked this port, so if anything goes wrong blame him.
