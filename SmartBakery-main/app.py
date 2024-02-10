# Imports
import os, certifi, threading, time
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
from datetime import datetime, timedelta
from influxdb_client_3 import InfluxDBClient3, Point, flight_client_options
from flask import Flask, jsonify, request, render_template

# This loads the .env file (contains InfluxDB and MQTT Details)
load_dotenv(override=True)

# Initialises a Flask Instance
app = Flask(__name__)

# Initialises an MQTT Broker and Topic Variables
mqtt_broker = os.environ.get("MQTT_BROKER")
topic_data = os.environ.get("MQTT_TOPIC_DATA")
topic_control = os.environ.get("MQTT_TOPIC_CONTROL")

# Initialises variables for use of InfluxDB Cloud
token = os.environ.get("INFLUXDB_TOKEN")
host = os.environ.get("INFLUXDB_HOST")
org = os.environ.get("INFLUXDB_ORG")
database = os.environ.get("INFLUXDB_DB")

# Reads TLS root certificates for InfluxDB
with open(certifi.where(), "r") as cfile:
    tls_root_certs = cfile.read()

# Initialises the Influx DB Client
dbclient = InfluxDBClient3(host=host,
                           token=token,
                           org=org,
                           database=database,
                           flight_client_options=flight_client_options(tls_root_certs=tls_root_certs))

# Gets the latest time
latestdbtime = datetime.now()

# Initialise the home route for Flask Web Application
@app.route("/")
def index():
    return render_template("index.html", url=request.base_url)

# This api route retrieves the latest sensor records
@app.get('/api/latest-sensor-record')
def get_latest_record():
    global latestdbtime

    # This queries InfluxDB Cloud for the latest sensor record
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

# This api route retrieves the latest period sensor records
@app.get('/api/period-sensor-record')
def get_period_record():

    # This queries InfluxDB Cloud for the latest periodic sensor record
    record = dbclient.query(query=f"SELECT * FROM \"data\" WHERE time >= '{latestdbtime - timedelta(minutes=5)}'").to_pandas()

    # This removes non-essential columns in the periodic sensor records
    record = record.drop(["buzzer_enabled","buzzer_state","high_temp","low_temp","manual_state"], axis = 1)
    record["time"] = record["time"].dt.strftime("%H:%M:%S").astype(str)
    return record.to_json()

# This api route retrieves the sensor commands from the dashboard
@app.put('/api/sensor-command')
def send_command():
    command = request.json

    # Initialises a Publisher
    mqtt_publisher = mqtt.Client()
    mqtt_publisher.connect(host=mqtt_broker, port=1883)
    print(f"\nClient was created at {time.strftime('%H:%M:%S')}")

    # Publishes new sensor commands in the topic 'topic_control'
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

# This function retrieves sensor data when a message is received from the Raspberry Pi and writes it to InfluxDB Cloud
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

# This starts the MQTT Subscriber to retrieve the sensor data from the Raspberry Pi
def startMQTT():
    mqtt_subscriber = mqtt.Client()

    # This calls the onMessage function to write data to InfluxDB Cloud
    mqtt_subscriber.on_message = onMessage
    mqtt_subscriber.connect(host=mqtt_broker, port=1883)
    mqtt_subscriber.subscribe(topic=topic_data, qos=1)
    mqtt_subscriber.loop_start()

# This function begins the whole application
if __name__ == "__main__":
    subscriberThread = threading.Thread(target=startMQTT)
    subscriberThread.start()
    app.run(host='0.0.0.0', port=5000, debug=True)