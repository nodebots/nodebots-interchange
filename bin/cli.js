#! /usr/bin/env node

var program = require('commander');
var version = require('../package.json').version;
var Interchange = require('../lib/interchange');
var interchange = new Interchange();

program
  .version(version);

program.command("list")
    .description("Lists all of the available firmwares")
    .alias("l")
    .action(interchange.list_devices.bind(interchange));

program.command("ports")
    .description("Lists all of the attached boards and their ports")
    .alias("p")
    .option("-v, --verbose", "List with additional information")
    .action(interchange.list_ports.bind(interchange));

program.command("read")
    .description("Read firmware info from port")
    .alias("r")
    .option("-p, --port", "Serial port board is attached to")
    .action(interchange.get_firmware_info.bind(interchange));

program.command("install [firmware]")
    .description("Install specified firmware to board")
    .alias("i")
    .option("-a, --board <board>", "Type of board/AVR")
    .option("-p, --port <port>", "Serial port board is attached to")
    .option("-f, --firmata [firmata]", "Install firmata version of firmware")
    .option("-i, --address <address>", "Specify I2C address, eg 0x67")
    .action(interchange.install_firmware.bind(interchange));

program.parse(process.argv);
