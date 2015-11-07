# nodebots-interchange

[![Join the chat at https://gitter.im/ajfisher/nodebots-interchange](https://img.shields.io/badge/Gitter-Join%20Chat-brightgreen.svg)](https://gitter.im/ajfisher/nodebots-interchange?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
![](https://img.shields.io/badge/status-Beta-orange.svg)
![](https://img.shields.io/david/ajfisher/nodebots-interchange.svg)
![](https://img.shields.io/github/issues/ajfisher/nodebots-interchange.svg)

Provides a mechanism to use custom backpacks and firmatas in your nodebots easily 
and without needing to use arduino or compile firmwares and all their dependencies.

Want to use a ping sensor on your nodebot or play around with neopixels? Plug in
your arduino or backpack, install the relevant firmware with interchange and 
start building that nodebot.

It's as easy as:

```
interchange install hc-sr04 -a nano -p /dev/tty.wchserial1410
```

No need to install arduino, no need to find the right firmware - interchange is
like npm for your backpacks.

Interchange provides the following:

* A specification for how backpack devices should behave
* An installation method for backpack firmware onto target boards to make 
backpack firmware selection and installation easy.
* A method of updating select parts of the firmware if required without recompilation.
* An ability to install Standard or Custom Firmatas to a board.
* An interface for retrieving information from a backpack firmware.

## Installation

To install nodebots-interchange install using npm

```
npm install ajfisher/nodesbots-interchange
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
interchange install <firmware> -p <port> -a <board_type> -i <I2C_address> [--firmata]
```

Where `<firmware>` is the name of the firmware you would like to flash to the board,
`<port>` is the name of the serial port you want to use, `<board_type>` is the 
specific type of board you would like to use and `<I2C_address>` is an optional
parameter allowing you to change the default address of the I2C device.

Using the `--firmata` switch will attempt to download and install a custom firmata
instead if this is available.

As a convenience, if you would like to install StandardFirmata you can do so by:

```
interchange install StandardFirmata -a <board> -p <port>
```

### Usage examples

Get help:

```
interchange --help
```

List the firmwares available and get details about them, including whether they
are firmata capable or not.

```
interchange list
```

Install the HC-SR04 backpack firmware to an arduino nano on port /dev/tty.wchserial1410.
(Ensure configuration mode is set on the arduino)

```
interchange install hc-sr04 -a nano -p /dev/tty.wchserial1410
```

Install the HC-SR04 backpack firmware to an arduino nano on port /dev/tty.wchserial1410
however change the default I2C address to 0x65 instead. (Ensure configuration 
mode on the arduino is set).

```
interchange install hc-sr04 -a nano -p /dev/tty.wchserial1410 -i 0x65
```

Install StandardFirmata on an arduino Uno at port /dev/tty.usbmodem1230

``` 
interchange install StandardFirmata -a uno -p /dev/tty.usbmodem1230
```

Install the HC-SR04 custom firmata on an arduino Uno at port /dev/tty.usbmodem1230

```
interchange install hc-sr04 -a uno -p /dev/tty.usbmodem1230 --firmata
```

Install the custom mbot firmata onto an arduino from a git repository and not
from the interchange directory (good for testing in development) on port
/dev/tty.wchserial1560

```
interchange install git+https://github.com/Makeblock-official/mbot_nodebots -p /dev/tty.wchserial1560 -a uno --firmata
```

Read the details of a backpack firmware on /dev/tty.usbmodem1130 to see what 
was on it.

```
interchange read -p /dev/tty.usbmodem1130
```


## Building your own interchange package.

If you want to build your own interchange package you can get more information
in the [developer guide](/docs/dev.md).

## Contribution

If you are interesting in contibuting, please read the [dev getting started
guide](/docs/contribution.md).

Additional documentation: https://docs.google.com/document/d/1j6Jce2MUSA-V-I9iO6lReZGtDWXvi9BI2Xh1RjErYek/edit?usp=sharing

# Acknowledgements

Interchange was born of an idea that came out of RobotsConf 2014 that started
with a discussion about how to incorporate NeoPixel support into 
[Firmata](https://github.com/firmata/arduino) and 
[Johnny-Five](https://github.com/rwaldron/johnny-five). Adding custom additions
to firmata created numerous problems, not just with the bloat that it would
cause in firmata but additionally the support requirements it would impose on 
other IO Plugins as any custom instructions would then need to be supported as well.

The end solution was to instead create a custom NodeBots "board", in the
style of a "BackPack" (as used by AdaFruit & others in the hardware space) that
would act as a bridge between "dumb" devices such as ultrasonic sensors,
neopixels and touch screens that would then expose these components as I2C 
devices. In this way, any nodebots capable board that can talk I2C (just about
all of them) would be able to work with these components, not just those running
firmata.

As the project has developed, it was determined that being able to use it to 
eliminate the need for Arduino for beginners was also useful and would use the
same mechanism. 

This project would not have seen light were it not for the following people:

* Rick Waldron - believing this was a good approach and supporting the exploration
of the idea to augment Johnny Five.
* Suz Hinton - for the excellent avrgirl which provided considerable heavy lifting on the 
flashing side of things.
* Andy Gelme, Luis Montes - for pushing me on backpacks and keep me moving.
