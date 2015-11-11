#! /usr/bin/env node

var program = require('commander');
var version = require('../package.json').version;
var Interchange = require('../interchange');
var interchange = new Interchange();

program
  .version(version);

program.command("list")
    .description("Lists all of the available firmwares")
    .alias("l")
    .action(interchange.list_devices);

program.command("ports")
    .description("Lists all of the attached boards and their ports")
    .alias("p")
    .option("-v, --verbose", "List with additional information")
    .action(interchange.list_ports);

program.command("read")
    .description("Read firware info from port")
    .alias("r")
    .option("-p, --port", "Serial port board is attached to")
    .action(function (opts) {
        if (!opts.port) {
            console.error("Please provide a device path".red);
            return;
        }

        interchange.get_firmware_info(opts.port);
    });

program.command("install [firmware]")
    .description("Install specified firmware to board")
    .alias("i")
    .option("-a, --board <board>", "Type of board/AVR")
    .option("-p, --port <port>", "Serial port board is attached to")
    .option("-f, --firmata", "Install firmata version of firmware")
    .option("-i, --address <address>", "Specify I2C address")
    .action(function (firmware, opts) {
        if (!firmware) {
            console.error("Please supply a firmware to install".red);
            return;
        }

        var settings = {
            board: opts.board || process.env.INTERCHANGE_BOARD || "nano",
            port: opts.port || process.env.INTERCHANGE_PORT,
            firmata: opts.firmata,
            i2c_address: opts.address,
        };

        try {
            interchange.check_firmware(firmware, settings, function(hex_path, tmp_dir, options) {

                interchange.flash_firmware(hex_path, options, function() {
                    // once complete destory the tmp_dir.
                    if (tmp_dir) {
                        interchange.clean_temp_dir(tmp_dir);
                    }
                });
            });
        } catch (e) {
            console.error(e.red);
            return;
        }
    });

program.parse(process.argv);
