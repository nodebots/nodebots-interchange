#! /usr/bin/env node

const _ = require('lodash');
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
  .action(() => {
    const list = interchange.list_devices();
    let outstr = '\nFirmwares available for backpacks. (f) denotes a firmata version is available\n\n';
    list.forEach((fw) => {
      outstr += ` ${fw.name} ${fw.firmata ? '(f)' : ''}: ${fw.description}\n`;
    });
    console.info(outstr);
  });

program.command('ports')
  .description('Lists all of the attached boards and their ports')
  .alias('p')
  .option('-v, --verbose', 'List with additional information')
  .action((opts) => {
    // get the ports and then list them out.
    interchange.get_ports()
      .then((ports) => {
        if (opts.verbose) {
          console.info(ports);
        } else {
          ports.forEach((port) => {
            console.info(port.path.cyan);
          });
        }
      })
      .catch(err => console.log(err));
  });

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
      // Wait for the inquirer to initialise then call the prompt
      new Inquire(interchange.install_firmware.bind(interchange))
        .then((inquire) => inquire.prompt())
        .catch(err => { throw err });
    } else {
      interchange.install_firmware(firmware, opts);
    }
  });

program.parse(process.argv);
