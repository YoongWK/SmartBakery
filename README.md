# Smart Bakery

The Smart Bakery system is a comprehensive solution for monitoring and controlling temperature and humidity within a bakery. Using a Raspberry Pi Model 3B with a BME280 module, the system publishes data from the bakery to a Flask server via MQTT for storage in an InfluxDB V3.0 Cloud Serverless database. Users can view the bakery data via a Web Dashboard created using HTML, CSS, and JavaScript.

The dashboard also allows users to set temperature thresholds, control heating (Bulb) and cooling (Fan) devices, and activate/deactivate a buzzer alert for extreme temperatures. Moreover, an RGB LED provides a clear visual indication of the current operational status for floor managers in the bakery. Additionally, the system can operate automatically where fan speed and bulb heat levels are adjusted according to the current temperature or manually for direct user control.

By providing real-time environmental tracking and responsive control, the system can maintain optimal conditions in the bakery for high-quality baked goods.

<br />

## Instructions for Raspberry Pi Model 3B Setup
> Step 1: Fabricate the PCB using the gerber files in EAGLE\PCB\SmartBakerySensor

> Step 2: Assemble the PCB

> Step 3: Connect the PCB to the Raspberry Pi Model 3B

> Step 4: Run the Smart_Bakery_Sensor.py Python script in the the Raspberry Pi Model 3B

<br />

## Instructions for Dashboard Setup
> Step 1: Download the app

```bash
git clone https://github.com/YoongWK/SmartBakery.git
cd SmartBakery
```

> Step 2: Enter your MQTT & InfluxDB V3.0 Cloud Serverless details in the .env.example file

> Step 3: Rename the .env.example file to .env

> Step 4: Create the Python virtual environment

```bash
python -m venv .venv
```

> Step 5: Set the execution policy of the current user to unrestricted

```bash
Set-ExecutionPolicy -ExecutionPolicy Unrestricted  -Scope CurrentUser
```

> Step 6: Activate the virtual environment

```bash
.venv\Scripts\activate
```

> Step 7: Install the required libraries into the virtual environment

```bash
pip install -r requirements.txt
```

> Step 8: Run the app

```bash
python app.py
```