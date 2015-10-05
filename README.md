# nodebots-interchange

[![Join the chat at https://gitter.im/ajfisher/nodebots-interchange](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ajfisher/nodebots-interchange?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Providing a mechanism to use custom backpacks for your nodebots.

## Overview

Interchange was born of an idea that came out of RobotsConf 2014 that started
with a discussion about how to incorporate NeoPixel support into 
[Firmata](https://github.com/firmata/arduino) and 
[Johnny-Five](https://github.com/rwaldron/johnny-five). Adding custom additions
to firmata created numerous problems, not just with the bloat that it would
cause in firmata but additionally the support requirements it would impose on 
other IO Plugins as any custom instructions would then need to be supported as well.

The end the solution was to instead create a custom NodeBots "board", in the
style of a "BackPack" (as used by AdaFruit & others in the hardware space) that
would act as a bridge between "dumb" devices such as ultrasonic sensors,
neopixels and touch screens that would then expose these components as I2C 
devices. In this way, any nodebots capable board that can talk I2C (just about
all of them) would be able to work with these components, not just those running
firmata.

Interchange provides the following:

* A specification for how backpack devices should behave
* An installation method for backpack firmware onto target boards to make 
backpack firmware selection and installation easy.
* A method of updating select parts of the firmware if required.

## Installation

To install nodebots-interchange install from npm

(CURRENTLY THIS DOESN'T WORK AS IT HASN'T BEEN PUBLISHED)

```
npm install nodesbots-interchange
```

Alternatively

```
git clone https://github.com/ajfisher/nodebots-interchange.git
npm install
```

Once installed you will have access to the `interchange` application which will allow
you to flash your board with a firmware of choice.

## Usage

In general:

```
interchange <firmware> -p <port> -b <board_type> -a <I2C_address>
```

Where `<firmware>` is the name of the firmware you would like to flash to the board,
`<port>` is the name of the serial port you want to use, `<board_type>` is the 
specific type of board you would like to use and `<I2C_address>` is an optional
parameter allowing you to change the default address of the I2C device.

Available firmware and their descriptions can be found by running:

```
interchange --list
```

## Building your own interchange package.

If you want to build your own interchange package you can get more information
in the [developer guide](/docs/dev.md).

## Contribution

If you are interesting in contibuting, please read the [dev getting started
guide](/docs/contribution.md).

Additional documentation: https://docs.google.com/document/d/1j6Jce2MUSA-V-I9iO6lReZGtDWXvi9BI2Xh1RjErYek/edit?usp=sharing

# Acknowledgements

This project would not have seen light were it not for the following people:

* Rick Waldron - believing this was a good approach and supporting the exploration
of the idea to augment Johnny Five.
* Suz Hinton - for the excellent avrgirl which provided considerable heavy lifting on the 
flashing side of things.
* Andy Gelme, Luis Montes - for pushing me on backpacks and keep me moving.
