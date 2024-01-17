import os, certifi, threading, time
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
from influxdb_client_3 import InfluxDBClient3, Point, flight_client_options
from flask import Flask, jsonify, request, render_template

load_dotenv(override=True)

app = Flask(__name__)

mqtt_broker = os.environ.get("MQTT_BROKER")
topic_data = os.environ.get("MQTT_TOPIC_DATA")
topic_control = os.environ.get("MQTT_TOPIC_CONTROL")

token = os.environ.get("INFLUXDB_TOKEN")
host = os.environ.get("INFLUXDB_HOST")
org = os.environ.get("INFLUXDB_ORG")
database = os.environ.get("INFLUXDB_DB")

with open(certifi.where(), "r") as cfile:
    tls_root_certs = cfile.read()

dbclient = InfluxDBClient3(host=host,
                           token=token,
                           org=org,
                           database=database,
                           flight_client_options=flight_client_options(tls_root_certs=tls_root_certs))

@app.route("/")
def index():
    return render_template("index.html", url=request.base_url)

@app.get('/api/latest-sensor-record')
def get_latest_record():
    record = dbclient.query(query=f"SELECT * FROM \"data\" ORDER BY time DESC LIMIT 1").to_pandas().iloc[0]
    latest_record = {"time": record['time'].strftime("%d/%m/%Y - %H:%M:%S"),
                      "temp": float(record['temp']),
                      "hum": float(record['hum']),
                      "fan_speed": int(record['fan_speed']),
                      "bulb_heat": int(record['bulb_heat']),
                      "manual_state": int(record['manual_state'])}
    return jsonify(latest_record)

@app.put('/api/sensor-command')
def send_command():
    command = request.json
    mqtt_publisher = mqtt.Client()
    mqtt_publisher.connect(host=mqtt_broker, port=1883)
    print(f"\nClient was created at {time.strftime('%H:%M:%S')}")

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

def onMessage(client, userdata, message):
    time, temp, hum, fan_speed, bulb_heat, manual_state = message.payload.decode('utf-8').split(',')
    record = (Point("data")
              .time(time)
              .field("temp", float(temp))
              .field("hum", float(hum))
              .field("fan_speed", int(fan_speed))
              .field("bulb_heat", int(bulb_heat))
              .field("manual_state", int(manual_state)))
    dbclient.write(record=record)

def startMQTT():
    mqtt_subscriber = mqtt.Client()
    mqtt_subscriber.on_message = onMessage
    mqtt_subscriber.connect(host=mqtt_broker, port=1883)
    mqtt_subscriber.subscribe(topic=topic_data, qos=1)
    mqtt_subscriber.loop_start()

if __name__ == "__main__":
    subscriberThread = threading.Thread(target=startMQTT)
    subscriberThread.start()
    app.run(host='0.0.0.0', port=5000, debug=True)