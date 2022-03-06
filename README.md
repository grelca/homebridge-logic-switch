# homebridge-logic-switch

With this plugin, you can create rule-based switches and sensors. When input switches are turned on or off,
corresponding output sensors are activated or deactivated based on configured rules. The same inputs can be
used across multiple outputs sensors, and your output sensors can also be reused as an input for another
output, which allows for complex rules to be created.

## Example config.json

```json
    "accessories": [
        {
            "accessory": "LogicSwitch",
            "name": "Logic Switches",
            "conditions": [
                {
                    "output": "output one",
                    "gate": "AND",
                    "inputs": [
                        "input one",
                        "input two"
                    ]
                }
            ]
        }
    ]
```

| Parameter | Description | Required | Default | Type |
| --- | --- | --- | --- | --- |
| accessory | Should always be "LogicSwitch" | ✔ | | string |
| name | A name for your switch group | ✔ | | string |
| conditions | Define your inputs, outputs, and rules | ✔ | | array |
| conditions.*.output | The name of an output sensor | ✔ | | string |
| conditions.*.gate | Logic Gate to use. Supported types are "AND", "OR", "NOT" | | "AND" | string |
| conditions.*.inputs | Names of input switches/sensors | ✔ | | array of strings |

## How to use

Input-only switches will be created as switch accessories that you can manually flip on and off (or set up
automations to do so). Outputs are created as motion sensors. This includes outputs that are used as an input
for another sensor.

As an example use case, perhaps you want to turn a light on for your pets when you're away from home at night.
While you could probably accomplish this with vanilla HomeKit automations, this plugin is intended to simplify
such a flow. Set up an "away at night" output controlled by "away from home" and "nighttime" inputs. Set up two
automations that enable your switches when you leave home and at sunset, respectively, and create a third
automation which turns on the lights when your motion sensor is activated.
