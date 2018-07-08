# NodeBots Interchange Developer Guide

This document outlines the process for developing an Interchange compatible 
I2C device.

## Overview

* how it all works
* general process

## Supported boards

The following boards are supported and all interchange compliant firmwares must
have builds and precompiled binaries for at minimum these boards.

* Arduino Uno (called `uno`)
* Arduino Nano (called `nano`)
* Arduino ProMini (called `pro-mini`)

Additional boards can also be supported (eg in the case of a Firmata) by using
the same naming convention as is used in [avrgirl](https://github.com/noopkat/avrgirl-arduino#how-do-i-use-it)

To keep your repos small, it's suggested that you use a clean up script in order
to simply ship the hex file, not all the supporting compilation files.

## Environment set up

* Use arduino 1.6.6+
* Use environment variables for control

## Code requirements

In order to be compatible with Interchange the firmware that is put on the board
needs to comply with a minimum set of interfaces. These are documented in 
detail below.

### Firmware

* Must read value from EEPROM called `I2C_ADDRESS` and use this in place of 
any default that is set.
* Code must be compilable without the "installation" of any 3rd party libraries
in the arduino environment. If required, submodules can be used in git however
the assumption is that the project gruntfile will take care of automating the
movement of these files to appropriate locations as needed
* Where possible, firmware instructions should attempt to mirror an existing 
controller interface in order to minimise controller bloat in Johnny Five.

The EEPROM of the device should follow the following memory map to keep things
consistent.

| Memory position | Type | Name           | Description                                                |
|-----------------|------|----------------|------------------------------------------------------------|
| 0x00-0x07       | null | Reserved       | Reserved for future use                                    |
| 0x08            | byte | I2C Address    | I2C Address of the device                                  |
| 0x09            | bool | Custom Address | Using custom address (0x01 means using a custom address)   |
| 0x0A            | byte | Firmware ID    | ID of the firmware being used (maps to the repository)     |
| 0x0B            | byte | Creator ID     | ID of the creator of the firmware (maps to the repository) |
|                 |      |                |                                                            |

The firmware must expose a CONFIG mode in order to configure the device. Typically
this will be done by pulling a pin HIGH during boot which will drop it into 
configuration mode. A firmware CONFIG mode must work to the following standards:

* Serial interface using 9600 BAUD 8N1 (standard arduino serial interface)
* Messages are NL (`\n`) terminated for the send

A firmware configuration must implement the following configuration options:

| Command | Parameters | Action | Notes |
|---------|----------------------------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| HELP | [CMD] | Help | Provides any help information relating to the firmware and config mode. Optional command will provide detail for that instruction |
| DUMP | none | Dump settings | Prints out all of the current settings that the firmware has configured, providing at a minimum the I2C address, the version of the firmware, the firmware and creator IDs and whether a custom address is in use. |
| I2C | address (byte) custom flag (bit) | Set address | Sets the I2C address of this device. eg: `I 0x56 1` sets the I2C address to 0x56 with custom flag set to True |
| FID | ID (byte) | Set Firmware ID | Sets the firmware ID of this device |
| CID | ID (byte) | Set creator ID | Sets the creator ID of this device |
| CLR |  | Clears EEPROM  | Clears all of the interchange eeprom registers back to default |


### Johnny Five

* A complimentary controller should be provided by the library or made available
in Johnny-Five directly. 
* Where possible, an existing controller should be used and an alias created

## Build of firmware

You can build your firmware any way you like, however here is a suggested
process that you can use.

* Use Grunt to create files for build
* Use Arduino IDE to automate build of each type of firmware outputting HEX files.
* Put compiled hex files into a folder (eg `/firmware/bins/`) with each of the hex files
for the different supported boards in a separate directory per it's reference 
name, for example: `/firmware/bins/uno/...` 
* Clean any intermediate compilation files that are produced as artefacts of the
compilation process, leaving just the hex file for shipping.

## Repo structure

There are certain mandatories that must be in the repo as outlined below.

### Manifest file

A manifest file must be present at the root of the repo and called `manifest.json`.
This will comprise any repo specific components to do with, for example, paths 
to binary firmwares etc.

Current manifest file requirements
```
{
    "backpack" : {
        // information for the backpack files
        "bins": "/firmware/bins/backpack/", // path to the precompiled binaries folder from the root of the repo
        "hexPath": "/firmware_backpack.hex" // path from the package folder to the actual hex file
    }
    "firmata" : {
        // information for the firmata files
        "bins": "/firmware/bins/firmata/", // path to the precompiled binaries folder from the root of the repo
        "hexPath": "/firmware_firmata.hex" // path from the package folder to the actual hex file
    }
}
```

Optionally, in the case where you have multiple firmatas available you can
provide a directive to indicate that that is the case and then list the various
firmata as objects, each with their own `bins` and `hexPath` values. For example:

```javascript
{
    "firmata": {
        "multi": true,
            "usb": {
                "bins": "/firmware/bins/usb/",
                "hexPath": "/firmware_usb.hex"
            },
            "bluetooth": {
                "bins": "/firmware/bins/bluetooth/",
                "hexPath": "/firmware_bluetooth.hex"
            }
    }
}
```

## Publishing to Interchange

Add a reference to the /lib/firmwares.json file with appropriate details


