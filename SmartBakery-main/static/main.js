// These are colour variables
var blue = "#368BEE";
var green = "#36EE99";
var darkGreen = "#25A66B";
var darkBlue = "#307DD6";
var red = "#EE368B";
var darkRed = "#DE1371";
var aqua = "#36E7EE";
var darkAqua = "#30CFD6";
var purple = "#9936EE";
var darkPurple = "#7A2BBE";
var darkOrange = "#EE9936";
var translucentGrey = "rgba(102, 102, 102, 0.8)";

// This is a DOM variable to update latest TimeStamps
var timestampSpan = document.getElementById("time");

// These are DOM variables for graph and user interface creation
var manualSwitch = document.getElementById("manual-switch");

// Graph DOM Variables
var temperatureGaugeDiv = document.getElementById("temperature-gauge");
var humidityGaugeDiv = document.getElementById("humidity-gauge");
var temperatureGraph = document.getElementById("temperature-graph");
var humidityGraph = document.getElementById("humidity-graph");
var bulbHeatGraph = document.getElementById("bulb-heat-graph");
var fanSpeedGraph = document.getElementById("fan-speed-graph");

// Slider DOM variables
var fanSpeedSlider = document.getElementById("fan-speed-slider");
var fanSpeedText = document.getElementById("fan-speed-text");
var bulbHeatSlider = document.getElementById("bulb-heat-slider");
var bulbHeatText = document.getElementById("bulb-heat-text");

// Icon DOM variables
var okIcon = document.getElementById("ok-icon");
var alertIcon = document.getElementById("alert-icon");
var lowTempText = document.getElementById("low-temp-text");
var highTempText = document.getElementById("high-temp-text");

// Button DOM Variables
var lowTempMinusButton = document.getElementById("low-temp-minus-button");
var lowTempPlusButton = document.getElementById("low-temp-plus-button");
var highTempMinusButton = document.getElementById("high-temp-minus-button");
var highTempPlusButton = document.getElementById("high-temp-plus-button");
var buzzerEnableButton = document.getElementById("buzzer-enable-button");


// This is the step value constant variable
var step = 0.5;

// These are default initial values for the User Interface
var temperature = 25;
var low_temp = 20;
var high_temp = 30;
var humidity = 65;
var low_hum = 40;
var high_hum = 70;
var periodTime = ["12:00:00", "12:00:30", "12:01:00", "12:01:30", "12:02:00",
                  "12:02:30", "12:03:00", "12:03:30", "12:04:00", "12:04:30", "12:05:00"];
var periodTemp = [26.5, 26.2, 25.8, 25.9, 25.4, 25.2, 26.3, 26.5, 25.8, 25.2, 25.0];
var periodHum = [72.6, 82.3, 75.4, 72.1, 73.2, 70.5, 68.4, 67.3, 66.2, 65.5, 65.0];
var periodBulbHeat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var periodFanSpeed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// This variable intialises the temperature gauge
var temperatureData = [
    {
        type: "indicator",
        mode: "gauge+number",
        value: temperature,
        number: {
            suffix: "°C",
            font: {
                size: 24,
                color: temperature < low_temp? darkBlue :
                       (temperature > high_temp? darkRed : darkGreen),
            },
            valueformat: ".2f",
        },
        gauge: {
            axis: {
                tickvals: [0, 50],
                range: [0, 50],
            },
            steps: [
                {
                    range: [0, low_temp],
                    color: blue,
                },
                {
                    range: [low_temp, high_temp],
                    color: green,
                },
                {
                    range: [high_temp, 50],
                    color: red,
                },
            ],
            bar: {
                color: translucentGrey,
            },
            borderwidth: 0,
        },
    },
];

// This variable intialises the humidity gauge
var humidityData = [
    {
        type: "indicator",
        mode: "gauge+number",
        value: humidity,
        number: {
            suffix: "%",
            font: {
                size: 24,
                color: humidity < low_hum? darkAqua :
                       (humidity > high_hum? darkPurple : darkBlue),
            },
            valueformat: ".2f",
        },
        gauge: {
            axis: {
                tickvals: [0, 100],
                range: [0, 100],
            },
            steps: [
                {
                    range: [0, low_hum],
                    color: aqua,
                },
                {
                    range: [low_hum, high_hum],
                    color: blue,
                },
                {
                    range: [high_hum, 100],
                    color: purple,
                },
            ],
            bar: {
                color: translucentGrey,
            },
            borderwidth: 0,
        },
    },
];

// This initialises the graph with temperature data
var temperaturePeriodData = [
    {
        x: periodTime,
        y: periodTemp,
        mode: "lines",
        line: {
            color: temperature < low_temp? darkBlue :
                   (temperature > high_temp? darkRed : darkGreen),
        },
        hovertemplate: 'Temperature: %{y}°C<br>Time: %{x}',
        name: "",
    }
];

// This initialises the graph with humidity data
var humidityPeriodData = [
    {
        x: periodTime,
        y: periodHum,
        mode: "lines",
        line: {
            color: humidity < low_hum? darkAqua :
                   (humidity > high_hum? darkPurple : darkBlue),
        },
        hovertemplate: 'Humidity: %{y}%<br>Time: %{x}',
        name: "",
    }
];

// This initialises the graph with bulb heat data
var bulbHeatPeriodData = [
    {
        x: periodTime,
        y: periodBulbHeat,
        mode: "lines",
        line: { color: darkOrange },
        hovertemplate: 'Bulb Heat: %{y}<br>Time: %{x}',
        name: "",
    }
];

// This initialises the graph with fan speed data
var fanSpeedPeriodData = [
    {
        x: periodTime,
        y: periodFanSpeed,
        mode: "lines",
        line: { color: darkBlue },
        hovertemplate: 'Fan Speed: %{y}<br>Time: %{x}',
        name: "",
    }
];

// This configures the gauge cluster layout
var gaugeLayout = {
    height: 110,
    width: 240,
    margin: {
        t: 0,
        b: 0,
        l: 35,
        r: 35,
    }
};

// This configures the primary graph cluster layout
var graphLayout_1 = {
    height: 255,
    autosize: true,
    xaxis: {
        nticks: 10,
        tickangle: -45,
        showgrid: false,
        automargin: true,
        fixedrange: true,
    },
    yaxis: {
        showgrid: false,
        automargin: true,
        fixedrange: true,
        rangemode: 'nonnegative',
        zeroline: false,
    },
    margin: {
        pad: 15,
        t: 0,
        b: 0,
        l: 0,
        r: 20,
    }
};

// This configures the secondary graph cluster layout
var graphLayout_2 = {
    height: 255,
    autosize: true,
    xaxis: {
        nticks: 10,
        tickangle: -45,
        showgrid: false,
        automargin: true,
        fixedrange: true,
    },
    yaxis: {
        showgrid: false,
        automargin: true,
        fixedrange: true,
        range: [0, 6],
        tickvals: [0, 1, 2, 3, 4, 5],
        zeroline: false,
    },
    margin: {
        pad: 15,
        t: 0,
        b: 0,
        l: 0,
        r: 20,
    }
};

// This generates the graph plots
Plotly.newPlot(temperatureGaugeDiv, temperatureData, gaugeLayout, {displayModeBar: false});
Plotly.newPlot(humidityGaugeDiv, humidityData, gaugeLayout, {displayModeBar: false});
Plotly.newPlot(temperatureGraph, temperaturePeriodData, graphLayout_1, {displayModeBar: false});
Plotly.newPlot(humidityGraph, humidityPeriodData, graphLayout_1, {displayModeBar: false});
Plotly.newPlot(bulbHeatGraph, bulbHeatPeriodData, graphLayout_2, {displayModeBar: false});
Plotly.newPlot(fanSpeedGraph, fanSpeedPeriodData, graphLayout_2, {displayModeBar: false});

// This is an event listener for the manual / automatic state switch
manualSwitch.addEventListener("click", function (e) {
    e.preventDefault();
    var manualState = this.checked? 1 : 0 ;

    let command = { command: `manualstate,${manualState}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the fan speed slider
fanSpeedSlider.addEventListener("change", function () {
    var fanSpeed = fanSpeedSlider.value;
    fanSpeedText.innerText = fanSpeed;

    let command = { command: `fanspeed,${fanSpeed}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the bulb heat slider
bulbHeatSlider.addEventListener("change", function () {
    var bulbHeat = bulbHeatSlider.value;
    bulbHeatText.innerText = bulbHeat;

    let command = { command: `bulbheat,${bulbHeat}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the button to enable / disable the buzzer
buzzerEnableButton.addEventListener("click", function () {
    var updatedBuzzerEnabled = buzzerEnableButton.innerText == "Enabled"? 0 : 1 ;
    
    let command = { command: `buzzerenabled,${updatedBuzzerEnabled}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the button that decreases the lower temperature threshold
lowTempMinusButton.addEventListener("click", function () {
    var newLowTemp = +lowTempText.value.replace(" °C", "") - step;
    newLowTemp = newLowTemp >= 0? newLowTemp : 0 ;
    
    let command = { command: `lowtemp,${newLowTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the button that increases the lower temperature threshold
lowTempPlusButton.addEventListener("click", function () {
    var newLowTemp = +lowTempText.value.replace(" °C", "") + step;
    var maxLowTemp = +highTempText.value.replace(" °C", "") - step;
    newLowTemp = newLowTemp > maxLowTemp? maxLowTemp : newLowTemp ;
    
    let command = { command: `lowtemp,${newLowTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the button that decreases the higher temperature threshold
highTempMinusButton.addEventListener("click", function () {
    var newHighTemp = +highTempText.value.replace(" °C", "") - step;
    var minHighTemp = +lowTempText.value.replace(" °C", "") + step;
    newHighTemp = newHighTemp < minHighTemp? minHighTemp : newHighTemp ;
    
    let command = { command: `hightemp,${newHighTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This is an event listener for the button that increases the higher temperature threshold
highTempPlusButton.addEventListener("click", function () {
    var newHighTemp = +highTempText.value.replace(" °C", "") + step;
    newHighTemp = newHighTemp <= 50? newHighTemp : 50 ;
    
    let command = { command: `hightemp,${newHighTemp}` };

    fetch("/api/sensor-command", {
        method: "PUT",
        body: JSON.stringify(command),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
});

// This function updates the latest dashboard sensor records by calling the api route
function updateLatestSensorRecords() {
    fetch("/api/latest-sensor-record")
        .then((response) => response.json())
        .then((jsonResponse) => {
        let time = jsonResponse.time;
        let fan_speed = jsonResponse.fan_speed;
        let bulb_heat = jsonResponse.bulb_heat;
        let manual_state = jsonResponse.manual_state;
        let buzzer_state = jsonResponse.buzzer_state;
        let buzzer_enabled = jsonResponse.buzzer_enabled;
        temperature = jsonResponse.temp;
        low_temp = jsonResponse.low_temp;
        high_temp = jsonResponse.high_temp;
        humidity = jsonResponse.hum;

        // Sets the temperature gauge
        temperatureData = [
            {
                type: "indicator",
                mode: "gauge+number",
                value: temperature,
                number: {
                    suffix: "°C",
                    font: {
                        size: 24,
                        color: temperature < low_temp? darkBlue :
                               (temperature > high_temp? darkRed : darkGreen),
                    },
                    valueformat: ".2f",
                },
                gauge: {
                    axis: {
                        tickvals: [0, 50],
                        range: [0, 50],
                    },
                    steps: [
                        {
                            range: [0, low_temp],
                            color: blue,
                        },
                        {
                            range: [low_temp, high_temp],
                            color: green,
                        },
                        {
                            range: [high_temp, 50],
                            color: red,
                        },
                    ],
                    bar: {
                        color: translucentGrey,
                    },
                    borderwidth: 0,
                },
            },
        ];

        // Sets the humidity gauge
        humidityData = [
            {
                type: "indicator",
                mode: "gauge+number",
                value: humidity,
                number: {
                    suffix: "%",
                    font: {
                        size: 24,
                        color: humidity < low_hum? darkAqua :
                               (humidity > high_hum? darkPurple : darkBlue),
                    },
                    valueformat: ".2f",
                },
                gauge: {
                    axis: {
                        tickvals: [0, 100],
                        range: [0, 100],
                    },
                    steps: [
                        {
                            range: [0, low_hum],
                            color: aqua,
                        },
                        {
                            range: [low_hum, high_hum],
                            color: blue,
                        },
                        {
                            range: [high_hum, 100],
                            color: purple,
                        },
                    ],
                    bar: {
                        color: translucentGrey,
                    },
                    borderwidth: 0,
                },
            },
        ];

        // This sets up the user interface to remove / allow controls depending on the manual state
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

        // This sets up the user interface according to the buzzer state
        if (buzzer_state) {
            okIcon.hidden = true;
            alertIcon.hidden = false;
        } else {
            okIcon.hidden = false;
            alertIcon.hidden = true;
        }

        // This sets up the user interface depending on the buzzer enabled state
        if (buzzer_enabled) {
            buzzerEnableButton.classList.remove("background-red");
            buzzerEnableButton.classList.add("background-green");
            buzzerEnableButton.innerText = "Enabled";
        } else {
            buzzerEnableButton.classList.remove("background-green");
            buzzerEnableButton.classList.add("background-red");
            buzzerEnableButton.innerText = "Disabled";
        }

        // This prevents the temperature from being lowered < 0
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

        // This prevents the temperature from being raised > 50
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
        
        // This updates the gauges
        timestampSpan.innerText = time;
        Plotly.react(temperatureGaugeDiv, temperatureData, gaugeLayout, {displayModeBar: false});
        Plotly.react(humidityGaugeDiv, humidityData, gaugeLayout, {displayModeBar: false});
        lowTempText.value = `${low_temp} °C`;
        highTempText.value = `${high_temp} °C`;
        });
}

// This function updates the latest dashboard periodic sensor records by calling the api route
function updatePeriodSensorRecords() {
    fetch("/api/period-sensor-record")
        .then((response) => response.json())
        .then((jsonResponse) => {
            periodTime = Object.values(jsonResponse.time);
            periodTemp = Object.values(jsonResponse.temp);
            periodHum = Object.values(jsonResponse.hum);
            periodBulbHeat = Object.values(jsonResponse.bulb_heat);
            periodFanSpeed = Object.values(jsonResponse.fan_speed);

            // Sets up the Temperature Graph
            temperaturePeriodData = [
                {
                    x: periodTime,
                    y: periodTemp,
                    mode: "lines",
                    line: {
                        color: temperature < low_temp? darkBlue :
                               (temperature > high_temp? darkRed : darkGreen),
                    },
                    hovertemplate: 'Temperature: %{y}°C<br>Time: %{x}',
                    name: "",
                }
            ];

            // Sets up the Humidity Graph
            humidityPeriodData = [
                {
                    x: periodTime,
                    y: periodHum,
                    mode: "lines",
                    line: {
                        color: humidity < low_hum? darkAqua :
                               (humidity > high_hum? darkPurple : darkBlue),
                    },
                    hovertemplate: 'Humidity: %{y}%<br>Time: %{x}',
                    name: "",
                }
            ];

            // Sets up the Bulb Heat Graph
            bulbHeatPeriodData = [
                {
                    x: periodTime,
                    y: periodBulbHeat,
                    mode: "lines",
                    line: { color: darkOrange },
                    hovertemplate: 'Bulb Heat: %{y}<br>Time: %{x}',
                    name: "",
                }
            ];
            
            // Sets up the Fan Speed Graph
            fanSpeedPeriodData = [
                {
                    x: periodTime,
                    y: periodFanSpeed,
                    mode: "lines",
                    line: { color: darkBlue },
                    hovertemplate: 'Fan Speed: %{y}<br>Time: %{x}',
                    name: "",
                }
            ];

            // This updates the graphs
            Plotly.react(temperatureGraph, temperaturePeriodData, graphLayout_1, {displayModeBar: false});
            Plotly.react(humidityGraph, humidityPeriodData, graphLayout_1, {displayModeBar: false});
            Plotly.react(bulbHeatGraph, bulbHeatPeriodData, graphLayout_2, {displayModeBar: false});
            Plotly.react(fanSpeedGraph, fanSpeedPeriodData, graphLayout_2, {displayModeBar: false});
        });
}

// This loops the required functions to ensure the Flask Application gets the latest data
(function loop() {
    setTimeout(() => {
        updateLatestSensorRecords();
        updatePeriodSensorRecords();
        loop();
    }, 1000);
})();