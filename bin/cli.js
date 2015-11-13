#! /usr/bin/env node

var program = require('commander');
var inquirer = require('inquirer');
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
    .option("--interactive", "Interactive mode will prompt for input")
    .action(function (firmware, opts) {

        if (opts.interactive) {

            interchange.get_ports(function (err, ports) {

                var questions;

                if (err) {
                    console.error(err);
                    return;
                }

                questions = [
                    {
                        type: "list",
                        name: "firmware",
                        message: "Choose a firmware",
                        choices: interchange.firmwares.map(function (el) {
                            return el.name
                        })
                    },
                    {
                        type: "confirm",
                        name: "firmata",
                        message: "Install firmata version?",
                        default: false
                    },
                    {
                        type: "input",
                        name: "firmataType",
                        message: "Firmata name",
                        when: function (answers) {
                            return answers.firmata;
                        }
                    },
                    {
                        type: "list",
                        name: "avr",
                        message: "Choose a board",
                        choices: [
                            "uno",
                            "nano",
                            "promini",
                        ],
                        default: "nano"
                    },
                    {
                        type: "list",
                        name: "port",
                        message: "Choose a port",
                        choices: ports.map(function (el) {
                            return el.comName;
                        }),
                        default: null
                    },
                    {
                        type: "input",
                        name: "address",
                        message: "Choose an I2C address [optional]",
                        default: null
                    }
                ];

                inquirer.prompt(questions, function(answers) {
                    firmware = answers.firmware;
                    opts.board = answers.avr;
                    opts.port = answers.port;
                    opts.address = answers.address;
                    opts.firmata = answers.firmata ? answers.firmataType : answers.firmata;
                    interchange.install_firmware(firmware, opts);
                });

            });

            return;
        }

        interchange.install_firmware(firmware, opts);
    });

program.parse(process.argv);
