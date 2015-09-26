#! /usr/bin/env node

var version = require('../package.json').version;

var argv = require('minimist')(process.argv.slice(2));

function display_help() {
    // this function displays the help on this script.
    
    var usage = "NodeBots Interchange - backpack utilities - Version: " + version + "\n\n" +
                "usage: interchange [arguments] [firmware]\n" +
                "   or: interchange --list\n" +
                "   or: interchange --help\n" +
                "\n" +
                "Arguments:\n" +
                "  -v --version       Print version\n" +
                "  -b --board         Board type [uno|nano|mini]\n" +
                "  -p --port          Path to serial port / com port (eg. COM1, /dev/ttyUSB0 etc)\n" +
                "  -h --help          Prints this message and exits\n" +
                "\n\n";

    console.log(usage);
}

if (argv.h || argv.help) {
    display_help();
}

if (argv.v || argv.version) {
    console.log("NodeBots Interchange version: " + version);
}

