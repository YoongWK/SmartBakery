var timestampSpan = document.getElementById("time");

var temperatureGaugeDiv = document.getElementById("temperature-gauge");
var humidityGaugeDiv = document.getElementById("humidity-gauge");

var manualSwitch = document.getElementById("manual-switch");
var fanSpeedSlider = document.getElementById("fan-speed-slider");
var fanSpeedText = document.getElementById("fan-speed-text");
var bulbHeatSlider = document.getElementById("bulb-heat-slider");
var bulbHeatText = document.getElementById("bulb-heat-text");

var okIcon = document.getElementById("ok-icon");
var alertIcon = document.getElementById("alert-icon");
var buzzerEnableButton = document.getElementById("buzzer-enable-button");
var lowTempText = document.getElementById("low-temp-text");
var highTempText = document.getElementById("high-temp-text");
var step = 0.5;
var lowTempMinusButton = document.getElementById("low-temp-minus-button");
var lowTempPlusButton = document.getElementById("low-temp-plus-button");
var highTempMinusButton = document.getElementById("high-temp-minus-button");
var highTempPlusButton = document.getElementById("high-temp-plus-button");

manualSwitch.addEventListener("click", function (e) {
    e.preventDefault();
    var manualState = this.checked? "manualstate,1" : "manualstate,0";

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

buzzerEnableButton.addEventListener("click", function () {
    var updatedBuzzerEnabled = buzzerEnableButton.innerText == "Enabled"? 0 : 1 ;
    
    let command = { command: `buzzerenabled,${updatedBuzzerEnabled}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

lowTempMinusButton.addEventListener("click", function () {
    var newLowTemp = +lowTempText.value.replace(" °C", "") - step;
    newLowTemp = newLowTemp >= 0? newLowTemp : 0 ;
    
    let command = { command: `lowtemp,${newLowTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

lowTempPlusButton.addEventListener("click", function () {
    var newLowTemp = +lowTempText.value.replace(" °C", "") + step;
    var maxLowTemp = +highTempText.value.replace(" °C", "") - step;
    newLowTemp = newLowTemp > maxLowTemp? maxLowTemp : newLowTemp ;
    
    let command = { command: `lowtemp,${newLowTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

highTempMinusButton.addEventListener("click", function () {
    var newHighTemp = +highTempText.value.replace(" °C", "") - step;
    var minHighTemp = +lowTempText.value.replace(" °C", "") + step;
    newHighTemp = newHighTemp < minHighTemp? minHighTemp : newHighTemp ;
    
    let command = { command: `hightemp,${newHighTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
});

highTempPlusButton.addEventListener("click", function () {
    var newHighTemp = +highTempText.value.replace(" °C", "") + step;
    newHighTemp = newHighTemp <= 50? newHighTemp : 50 ;
    
    let command = { command: `hightemp,${newHighTemp}` };

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
    width: 220,
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
        let buzzer_state = jsonResponse.buzzer_state;
        let buzzer_enabled = jsonResponse.buzzer_enabled;
        let low_temp = jsonResponse.low_temp;
        let high_temp = jsonResponse.high_temp;

        timestampSpan.innerText = time;
        Plotly.update(temperatureGaugeDiv, { value: temperature });
        Plotly.update(humidityGaugeDiv, { value: humidity });

        if (manual_state) {
            manualSwitch.checked = true;
            fanSpeedSlider.disabled = false;
            bulbHeatSlider.disabled = false;
        } else {
            manualSwitch.checked = false;
            fanSpeedSlider.disabled = true;
            bulbHeatSlider.disabled = true;
            fanSpeedSlider.value = fan_speed;
            fanSpeedText.innerText = fan_speed;
            bulbHeatSlider.value = bulb_heat;
            bulbHeatText.innerText = bulb_heat;
        }

        if (buzzer_state) {
            okIcon.hidden = true;
            alertIcon.hidden = false;
        } else {
            okIcon.hidden = false;
            alertIcon.hidden = true;
        }

        if (buzzer_enabled) {
            buzzerEnableButton.classList.remove("background-red");
            buzzerEnableButton.classList.add("background-green");
            buzzerEnableButton.innerText = "Enabled";
        } else {
            buzzerEnableButton.classList.remove("background-green");
            buzzerEnableButton.classList.add("background-red");
            buzzerEnableButton.innerText = "Disabled";
        }

        lowTempText.value = `${low_temp} °C`;
        highTempText.value = `${high_temp} °C`;

        if (low_temp <= 0) {
            lowTempMinusButton.disabled = true;
            lowTempPlusButton.disabled = false;
        } else if ((low_temp + step) >= high_temp) {
            lowTempMinusButton.disabled = false;
            lowTempPlusButton.disabled = true;
        } else {
            lowTempMinusButton.disabled = false;
            lowTempPlusButton.disabled = false;
        }

        if (high_temp >= 50) {
            highTempMinusButton.disabled = false;
            highTempPlusButton.disabled = true;
        } else if ((high_temp - step) <= low_temp) {
            highTempMinusButton.disabled = true;
            highTempPlusButton.disabled = false;
        } else {
            highTempMinusButton.disabled = false;
            highTempPlusButton.disabled = false;
        }
        });
}

(function loop() {
    setTimeout(() => {
        updateSensorRecords();
        loop();
    }, 1000);
})();