#------------------------------------------------------------------- Header Start --------------------------------------------------------------------#
"""
    Project Title: Smart Bakery System
    Project Class: IOTP - PE04
    Project Group: 06
    Project File: app.py
    Project Developers: Andrina Wei Ning Morrison, Ryan Chong Jay Chin, Yoong Wai Kit
    Project Development Period: Nov 2023 - Feb 2024
"""
#-------------------------------------------------------------------- Header End ---------------------------------------------------------------------#

#------------------------------------------------------------------ Imports Start --------------------------------------------------------------------#
import os, certifi, threading, time
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
from datetime import datetime, timedelta
from influxdb_client_3 import InfluxDBClient3, Point, flight_client_options
from flask import Flask, jsonify, request, render_template
#------------------------------------------------------------------- Imports End ---------------------------------------------------------------------#

# Load the .env file containing the InfluxDB V3.0 Cloud Serverless & MQTT Details
load_dotenv(override=True)

#------------------------------------------------------------------ Variables Start ------------------------------------------------------------------#
# Create a Flask Instance
app = Flask(__name__)

# Get the MQTT details from the .env file
mqtt_broker = os.environ.get("MQTT_BROKER")
topic_data = os.environ.get("MQTT_TOPIC_DATA")
topic_control = os.environ.get("MQTT_TOPIC_CONTROL")

# Get the InfluxDB V3.0 Cloud Serverless details from the .env file
token = os.environ.get("INFLUXDB_TOKEN")
host = os.environ.get("INFLUXDB_HOST")
org = os.environ.get("INFLUXDB_ORG")
database = os.environ.get("INFLUXDB_DB")

# Get the TLS root certificate
with open(certifi.where(), "r") as cfile:
    tls_root_certs = cfile.read()

# Create a InfluxDB V3.0 Cloud Serverless Client Instance
dbclient = InfluxDBClient3(host=host,
                           token=token,
                           org=org,
                           database=database,
                           flight_client_options=flight_client_options(tls_root_certs=tls_root_certs))

# Get the latest time
latestdbtime = datetime.now()
#------------------------------------------------------------------- Variables End -------------------------------------------------------------------#

#------------------------------------------------------------------- Routes Start --------------------------------------------------------------------#
# Default route for Flask Web Application dashboard
@app.route("/")
def index():
    return render_template("index.html", url=request.base_url)

# API route to get the latest sensor record from the InfluxDB V3.0 Cloud Serverless database
@app.get('/api/latest-sensor-record')
def get_latest_record():
    global latestdbtime

    # SQL query for the latest sensor record from the InfluxDB V3.0 Cloud Serverless database
    record = dbclient.query(query=f"SELECT * FROM \"data\" ORDER BY time DESC LIMIT 1").to_pandas().iloc[0]
    latestdbtime = record['time']
    latest_record = {"time": record['time'].strftime("%d/%m/%Y - %H:%M:%S"),
                      "temp": float(record['temp']),
                      "hum": float(record['hum']),
                      "fan_speed": int(record['fan_speed']),
                      "bulb_heat": int(record['bulb_heat']),
                      "manual_state": int(record['manual_state']),
                      "buzzer_state": int(record['buzzer_state']),
                      "buzzer_enabled": int(record['buzzer_enabled']),
                      "low_temp": float(record['low_temp']),
                      "high_temp": float(record['high_temp'])}
    return jsonify(latest_record)

# API route to get the latest 5 minutes of sensor record from the InfluxDB V3.0 Cloud Serverless database
@app.get('/api/period-sensor-record')
def get_period_record():
    # SQL query for the latest 5 minutes of sensor record from the InfluxDB V3.0 Cloud Serverless database
    record = dbclient.query(query=f"SELECT * FROM \"data\" WHERE time >= '{latestdbtime - timedelta(minutes=5)}'").to_pandas()

    # Drop columns that are not needed
    record = record.drop(["buzzer_enabled","buzzer_state","high_temp","low_temp","manual_state"], axis = 1)

    # Convert time column to string datatype in "HH:MM:SS" format
    record["time"] = record["time"].dt.strftime("%H:%M:%S").astype(str)
    return record.to_json()

# API route to publish the sensor command to the 'topic_control' MQTT topic
@app.put('/api/sensor-command')
def send_command():
    command = request.json

    # Create the MQTT publisher
    mqtt_publisher = mqtt.Client()
    mqtt_publisher.connect(host=mqtt_broker, port=1883)
    print(f"\nClient was created at {time.strftime('%H:%M:%S')}")

    # Publish the sensor command
    try:
        payload = command['command']
        mqtt_publisher.publish(topic=topic_control, payload=payload, qos=1)
        print(f"Sent command: {payload}")
    
    except Exception as e:
        print(f"Error publishing\n{e}")
    
    else:
        mqtt_publisher.disconnect()
        print("Disconnected from broker\n")
    
    return "Success", 200
#-------------------------------------------------------------------- Routes End ---------------------------------------------------------------------#

#------------------------------------------------------------------ Functions Start ------------------------------------------------------------------#
# Function to write data to the InfluxDB V3.0 Cloud Serverless database based on the sensor data from the RPI
def onMessage(client, userdata, message):
    time, temp, hum, fan_speed, bulb_heat, manual_state, buzzer_state, buzzer_enabled, low_temp, high_temp = message.payload.decode('utf-8').split(',')
    record = (Point("data")
              .time(time)
              .field("temp", float(temp))
              .field("hum", float(hum))
              .field("fan_speed", int(fan_speed))
              .field("bulb_heat", int(bulb_heat))
              .field("manual_state", int(manual_state))
              .field("buzzer_state", int(buzzer_state))
              .field("buzzer_enabled", int(buzzer_enabled))
              .field("low_temp", float(low_temp))
              .field("high_temp", float(high_temp)))
    dbclient.write(record=record)

# Function to start the MQTT subscriber for sensor data from the 'topic_data' topic
def startMQTT():
    mqtt_subscriber = mqtt.Client()
    mqtt_subscriber.on_message = onMessage
    mqtt_subscriber.connect(host=mqtt_broker, port=1883)
    mqtt_subscriber.subscribe(topic=topic_data, qos=1)
    mqtt_subscriber.loop_start()
#------------------------------------------------------------------- Functions End -------------------------------------------------------------------#

#---------------------------------------------------------------- Main Program Start -----------------------------------------------------------------#
if __name__ == "__main__":
    # Start the MQTT subscriber thread for the 'topic_data' topic
    subscriberThread = threading.Thread(target=startMQTT)
    subscriberThread.start()

    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)
#----------------------------------------------------------------- Main Program End ------------------------------------------------------------------#
