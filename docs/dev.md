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
* Arduino ProMini (called `promini`)

## Environment set up

* Need arduino 1.6.4+
* Use environment variables for control
* Include a default make file for build and flash.

## Code requirements

### Firmware

* Must read value from EEPROM called `I2C_ADDRESS` and use this in place of 
default that is set.
* Code must be compilable without the "installation" of any 3rd party libraries
in the arduino environment. If required submodules can be used in git however
the assumption is that the project gruntfile will take care of automating the
movement of these files to appropriate locations.
* Where possible, firmware should attempt to mirror an existing controller 
interface in order to minimise controller bloat in Johnny Five.

// TODO - define any components here required in eeprom

I2C Address location:   EEPROM[2]
Backpack Ver Major:     EEPROM[3]
Backpack Ver Minor:     EEPROM[4]
Backpack Ver Patch:     EEPROM[5]


### Johnny Five

* A complimentary controller should be provided by the library or made available
in Johnny-Five directly. 
* Where possible, an existing controller should be used and an alias created

## Build of firmware

* use Grunt to create files for build
* Use Arduino IDE to automate build of each type of firmware outputting HEX files.
* Put hex files into a folder (eg `/firmware/bins/`) with each of the hex files
for the different supported boards in a separate directory per it's reference 
name, for example: `/firmware/bins/uno/...` 


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

## Publishing to Interchange

* Add a reference to the /lib/devices.json file with appropriate details
* Note detail here about what is required.
