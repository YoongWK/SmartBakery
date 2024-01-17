var timestampSpan = document.getElementById("time")

var temperatureGaugeDiv = document.getElementById("temperature-gauge");
var humidityGaugeDiv = document.getElementById("humidity-gauge")

var manualSwitch = document.getElementById("manual-switch");
var fanSpeedSlider = document.getElementById("fan-speed-slider");
var fanSpeedText = document.getElementById("fan-speed-text");
var bulbHeatSlider = document.getElementById("bulb-heat-slider")
var bulbHeatText = document.getElementById("bulb-heat-text")

manualSwitch.addEventListener("change", function () {
    if (this.checked) {
        var manualState = "manualstate,1";
        fanSpeedSlider.disabled = false;
        bulbHeatSlider.disabled = false;
    }
    else {
        var manualState = "manualstate,0";
        fanSpeedSlider.disabled = true;
        bulbHeatSlider.disabled = true;
    }

    let command = { command: manualState };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

fanSpeedSlider.addEventListener("change", function () {
    var fanSpeed = fanSpeedSlider.value;
    fanSpeedText.innerText = fanSpeed;

    let command = { command: `fanspeed,${fanSpeed}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

bulbHeatSlider.addEventListener("change", function () {
    var bulbHeat = bulbHeatSlider.value;
    bulbHeatText.innerText = bulbHeat;

    let command = { command: `bulbheat,${bulbHeat}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

var temperatureData = [
{
    type: "indicator",
    mode: "gauge+number",
    value: 0,
    number: {
        suffix: "°C",
        font: { size: 24 },
        valueformat: ".2f"
    },
    gauge: {
        axis: {
            tickvals: [0, 20, 30, 50],
            range: [0, 50]
        },
        steps: [
            {
                range: [0, 20],
                color: "#368BEE"
            },
            {
                range: [20, 30],
                color: "#36EE99"
            },
            {
                range: [30, 50],
                color: "#EE368B"
            },
        ],
        bar: {
            color: "rgba(102, 102, 102, 0.8)"
        },
        borderwidth: 0,
    },
},
];

var humidityData = [
{
    type: "indicator",
    mode: "gauge+number",
    value: 0,
    number: {
        suffix: "%",
        font: { size: 25 },
        valueformat: ".2f"
    },
    gauge: {
        axis: {
            tickvals: [0, 40, 70, 100],
            range: [0, 100]
        },
        steps: [
            {
                range: [0, 40],
                color: "#36E7EE"
            },
            {
                range: [40, 70],
                color: "#368BEE"
            },
            {
                range: [70, 100],
                color: "#9936EE"
            },
        ],
        bar: {
            color: "rgba(102, 102, 102, 0.8)"
        },
        borderwidth: 0,
    },
},
];

var gaugeLayout = {
    width: 225,
    height: 110,
    margin: {
        t: 0,
        b: 0,
        l: 35,
        r: 35
    }
};

Plotly.newPlot(temperatureGaugeDiv, temperatureData, gaugeLayout, {displayModeBar: false});
Plotly.newPlot(humidityGaugeDiv, humidityData, gaugeLayout, {displayModeBar: false});

window.onload = function setSensorRecords() {
    fetch("/api/latest-sensor-record")
        .then((response) => response.json())
        .then((jsonResponse) => {
        let time = jsonResponse.time;
        let temperature = jsonResponse.temp;
        let humidity = jsonResponse.hum;
        let fan_speed = jsonResponse.fan_speed;
        let bulb_heat = jsonResponse.bulb_heat;
        let manual_state = jsonResponse.manual_state;

        timestampSpan.innerText = time;
        Plotly.update(temperatureGaugeDiv, { value: temperature });
        Plotly.update(humidityGaugeDiv, { value: humidity });
        fanSpeedSlider.value = fan_speed;
        fanSpeedText.innerText = fan_speed;
        bulbHeatSlider.value = bulb_heat;
        bulbHeatText.innerText = bulb_heat;
        
        if (!manual_state) {
            manualSwitch.checked = false;
            fanSpeedSlider.disabled = true;
            bulbHeatSlider.disabled = true;
        } else {
            manualSwitch.checked = true;
            fanSpeedSlider.disabled = false;
            bulbHeatSlider.disabled = false;
        }
        });
}

function updateSensorRecords() {
    fetch("/api/latest-sensor-record")
        .then((response) => response.json())
        .then((jsonResponse) => {
        let time = jsonResponse.time;
        let temperature = jsonResponse.temp;
        let humidity = jsonResponse.hum;
        let fan_speed = jsonResponse.fan_speed;
        let bulb_heat = jsonResponse.bulb_heat;
        let manual_state = jsonResponse.manual_state;

        timestampSpan.innerText = time;
        Plotly.update(temperatureGaugeDiv, { value: temperature });
        Plotly.update(humidityGaugeDiv, { value: humidity });
        
        if ((!manual_state) && (!manualSwitch.checked)) {
            fanSpeedSlider.value = fan_speed;
            fanSpeedText.innerText = fan_speed;
            bulbHeatSlider.value = bulb_heat;
            bulbHeatText.innerText = bulb_heat;
        }
        });
}

(function loop() {
    setTimeout(() => {
        updateSensorRecords();
        loop();
    }, 1000);
})();