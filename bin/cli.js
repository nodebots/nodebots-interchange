#! /usr/bin/env node

const program = require('commander');
const version = require('../package.json').version;
const Interchange = require('../lib/interchange');
const Inquire = require('../lib/inquire');
const interchange = new Interchange();

program
  .version(version);

program.command('list')
  .description('Lists all of the available firmwares')
  .alias('l')
  .action(interchange.list_devices.bind(interchange));

program.command('ports')
  .description('Lists all of the attached boards and their ports')
  .alias('p')
  .option('-v, --verbose', 'List with additional information')
  .action(interchange.list_ports.bind(interchange));

program.command('read')
  .description('Read firmware info from port')
  .alias('r')
  .option('-p, --port', 'Serial port board is attached to')
  .action(interchange.get_firmware_info.bind(interchange));

program.command('install [firmware]')
  .description('Install specified firmware to board')
  .alias('i')
  .option('-a, --board <board>', 'Type of board/AVR')
  .option('-p, --port <port>', 'Serial port board is attached to')
  .option('-f, --firmata [firmata]', 'Install firmata version of firmware')
  .option('-i, --address <address>', 'Specify I2C address, eg 0x67')
  .option('--interactive', 'Interactive mode will prompt for input')
  .action(function(firmware, opts) {
    if (opts.interactive) {
      const inquire = new Inquire(interchange.install_firmware.bind(interchange));
    } else {
      interchange.install_firmware(firmware, opts);
    }
  });

program.parse(process.argv);
