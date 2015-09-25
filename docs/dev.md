# NodeBots Interchange Developer Guide

This document outlines the process for developing an Interchange compatible 
I2C device.

## Overview

* how it all works
* general process

## Supported boards

* Arduino Uno
* Arduino Nano
* Arduino ProMini

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

### Johnny Five

* A complimentary controller should be provided by the library or made available
in Johnny-Five directly. 
* Where possible, an existing controller should be used and an alias 

## Build of firmware

* use Grunt to create files for build
* Use Arduino IDE to automate build of each type of firmware outputting HEX files.
* Put hex files into repos according to the specified file structure so they can
be retrieved appropriately.

## Repo structure

* Document the structure here of how the repo should be structured.

## Publishing to Interchange

* Add a reference to the /lib/devices.json file with appropriate details
* Note detail here about what is required.
