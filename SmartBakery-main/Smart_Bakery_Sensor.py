#-------------------------------------------- Header Start ---------------------------------------------#
"""
    Project Title: Smart Bakery System
    Project Class: IOTP - PE04
    Project Group: 06
    Project Developers: Andrina Wei Ning Morrison, Ryan Chong Jay Chin, Yoong Wai Kit
    Project Development Period: Nov 2023 - Feb 2024
"""
#--------------------------------------------- Header End ----------------------------------------------#

#-------------------------------------------- Imports Start --------------------------------------------#
import time
import threading
from datetime import datetime
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import smbus2
import bme280
#--------------------------------------------- Imports End ---------------------------------------------#

#------------------------------------- RPI Pin Configuration Start -------------------------------------#
# RPI GPIO PIN Assignment
RED_LED_PIN = 11
GREEN_LED_PIN = 9
BLUE_LED_PIN = 10
BULB_PWM_PIN = 13
FAN_PWM_PIN = 19
BUZZER_PIN = 26

# RPI GPIO PIN Setting
GPIO.setmode(GPIO.BCM)
GPIO.setup(RED_LED_PIN, GPIO.OUT)
GPIO.setup(GREEN_LED_PIN, GPIO.OUT)
GPIO.setup(BLUE_LED_PIN, GPIO.OUT)
GPIO.setup(BULB_PWM_PIN, GPIO.OUT)
GPIO.setup(FAN_PWM_PIN, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)
BULB = GPIO.PWM(BULB_PWM_PIN, 100)
FAN = GPIO.PWM(FAN_PWM_PIN, 100)
#-------------------------------------- RPI Pin Configuration End --------------------------------------#

#------------------------------------------- Variables Start -------------------------------------------#
# Program Variable
run_program = True

# MQTT Variables
mqtt_broker = 'test.mosquitto.org'
topic_data = 'iotp/proj/grp06/sensordata'
topic_control = 'iotp/proj/grp06/sensorcontrol'

# BME280 Variables
bus = smbus2.SMBus(bus=1)
address = 0x76
calibration_params = bme280.load_calibration_params(bus=bus, address=address)

# Smart Bakery Variables
low_temp = 27
high_temp = 29
rgb_color = ""
fan_speed = 0
bulb_heat = 0
buzzer_enabled = 1
buzzer_state = 0
manual_state = 0
#-------------------------------------------- Variables End --------------------------------------------#

#------------------------------------------- Functions Start -------------------------------------------#

# This function sets the RGB Led according to the color input
def setRGBLEDColor(color):
    if color == "blue":
        GPIO.output(RED_LED_PIN, GPIO.LOW) #red low
        GPIO.output(GREEN_LED_PIN, GPIO.LOW) #green low
        GPIO.output(BLUE_LED_PIN, GPIO.HIGH) #blue high
    elif color == "green":
        GPIO.output(RED_LED_PIN, GPIO.LOW) #red low
        GPIO.output(GREEN_LED_PIN, GPIO.HIGH) #green high
        GPIO.output(BLUE_LED_PIN, GPIO.LOW) #blue low
    elif color == "red":
        GPIO.output(RED_LED_PIN, GPIO.HIGH) #red high
        GPIO.output(GREEN_LED_PIN, GPIO.LOW) #green low
        GPIO.output(BLUE_LED_PIN, GPIO.LOW) #blue low
    else:
        GPIO.output(RED_LED_PIN, GPIO.LOW) #red low
        GPIO.output(GREEN_LED_PIN, GPIO.LOW) #green low
        GPIO.output(BLUE_LED_PIN, GPIO.LOW) #blue

# This calculates the PWM speed
def calculateLevel(value, max_level, step):
    return min(int(value // step) + 1, max_level)

# This sets the bulb heat / power using PWM
def setBulbHeat(heat, max_level):
    BULB.ChangeDutyCycle(max(min(heat * (100 / max_level), 100), 0))

# This sets the fan speed / power using PWM
def setFanSpeed(speed, max_level):
    FAN.ChangeDutyCycle(max(min(speed * (100 / max_level), 100), 0))

# This sets the buzzer state
def setBuzzerState(state):
    GPIO.output(BUZZER_PIN, GPIO.LOW if (state == 0) else GPIO.HIGH)

# This sets up the Raspberry Pi according to the commands retrieved from the dashboard
def onMessage(client, userdata, message):
    global manual_state, fan_speed, bulb_heat, buzzer_enabled, low_temp, high_temp
    payload = message.payload.decode('utf-8')
    print(f"\nReceived command: {payload}")
    
    if "manualstate" in payload:
        manual_state = int(payload.split(',')[1])
    elif "fanspeed" in payload:
        fan_speed = int(payload.split(',')[1])
    elif "bulbheat" in payload:
        bulb_heat = int(payload.split(',')[1])
    elif "buzzerenabled" in payload:
        buzzer_enabled = int(payload.split(',')[1])
    elif "lowtemp" in payload:
        low_temp = float(payload.split(',')[1])
    elif "hightemp" in payload:
        high_temp = float(payload.split(',')[1])

# This starts the MQTT Subscriber that retrieves the Sensor Commands throught the 'topic_control' topic
def startMQTTSubscriber():
    mqtt_subscriber = mqtt.Client()
    mqtt_subscriber.on_message = onMessage
    mqtt_subscriber.connect(host=mqtt_broker, port=1883)
    mqtt_subscriber.subscribe(topic=topic_control, qos=1)
    mqtt_subscriber.loop_start()

# This starts the MQTT Publisher that publishes the sensor data through the 'topic_data' topic
# This function also handles the onboard device response to sensor data changes
def startMQTTPublisher():
    global rgb_color, fan_speed, bulb_heat, buzzer_state
    
    while run_program:
        date_time = datetime.now()
        data = bme280.sample(bus=bus, address=address, compensation_params=calibration_params)
        
        # This sets up the onboard devices according to the latest temperature readings
        if data.temperature >= high_temp:
            rgb_color = "red"
            if manual_state == 0:
                fan_speed = calculateLevel(value=(data.temperature - high_temp), max_level=5, step=0.5)
                bulb_heat = 0
            buzzer_state = 1
        elif data.temperature < low_temp:
            rgb_color = "blue"
            if manual_state == 0:
                fan_speed = 0
                bulb_heat = calculateLevel(value=(low_temp - data.temperature), max_level=5, step=0.5)
            buzzer_state = 1
        else:
            rgb_color = "green"
            if manual_state == 0:
                fan_speed = 0
                bulb_heat = 0
            buzzer_state = 0
        
        # Initialises the MQTT Publisher
        mqtt_publisher = mqtt.Client()
        mqtt_publisher.connect(host=mqtt_broker, port=1883)
        print(f"\nClient was created at {date_time.strftime('%H:%M:%S')}")
        
        # Publishes Sensor Data
        try:
            payload = f"{date_time},{data.temperature:.02f},{data.humidity:.02f},{fan_speed},{bulb_heat},{manual_state},{buzzer_state},{buzzer_enabled},{low_temp:.01f},{high_temp:.01f}"
            mqtt_publisher.publish(topic=topic_data, payload=payload, qos=1)
            print(f"Sent record: {payload}")
        except Exception as e:
            print(f"Error publishing\n{e}")
        else:
            mqtt_publisher.disconnect()
            print("Disconnected from broker")
        
        time.sleep(1)
#-------------------------------------------- Functions End --------------------------------------------#

#------------------------------------- RPI Pin Initialisation Start ------------------------------------#
setRGBLEDColor(color=rgb_color)
BULB.start(0)
FAN.start(0)
setBuzzerState(state=buzzer_state)
#-------------------------------------- RPI Pin Initialisation End -------------------------------------#

#------------------------------------------ Main Program Start -----------------------------------------#
subscriberThread = threading.Thread(target=startMQTTSubscriber)
subscriberThread.start()

publisherThread = threading.Thread(target=startMQTTPublisher)
publisherThread.start()

try:
    while run_program:        
        setRGBLEDColor(color=rgb_color)
        setBulbHeat(heat=bulb_heat, max_level=5)
        setFanSpeed(speed=fan_speed, max_level=5)
        setBuzzerState(state=buzzer_state if buzzer_enabled else 0)
        time.sleep(0.2)
except KeyboardInterrupt:
    run_program = False
except Exception as e:
    run_program = False
    print(e)
finally:
    GPIO.cleanup()
    print("\nGPIO cleaned up")
#------------------------------------------- Main Program End ------------------------------------------#