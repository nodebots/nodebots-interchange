const inquirer = require('inquirer');
const Interchange = require('../lib/interchange');
const firmwares = require('../lib/firmwares.json').firmwares;

const Inquire = function(cb) {
  // main entry point.

  if (typeof(cb) === 'undefined') {
    throw new Error('No callback defined to return to');
  }

  this.callback = cb;

  this.interchange = new Interchange();

  this.interchange.get_ports()
    .then(ports => this.promptQuestions(ports))
    .catch(err => { throw err });
};

Inquire.prototype.questions = function(ports) {
  // return the set of questions as an object (makes this easier to test);
  if (typeof(ports) == 'undefined') {
    throw new Error('No ports were provided to select from');
  }

  const questions = [
    {
      type: 'list',
      name: 'firmware',
      message: 'Choose a firmware',
      choices: this.interchange.firmwares.map((el) => {
        return el.name
      })
    },
    {
      type: 'confirm',
      name: 'firmata',
      message: 'Install firmata version?',
      default: (answers) => {
        return answers.firmware.indexOf('Firmata') > -1;
      },
      when: (answers) => {
        const firmware = firmwares.filter((obj) => {
          return obj.name === answers.firmware
        });

        return firmware.length && firmware[0].firmata && answers.firmware.indexOf('Firmata') === -1;
      }
    },
    {
      type: 'input',
      name: 'firmataType',
      message: 'Firmata name [optional]',
      default: null,
      when: (answers) => {
        return answers.firmata;
      }
    },
    {
      type: 'list',
      name: 'avr',
      message: 'Choose a board',
      choices: [
        'uno',
        'nano',
        'pro-mini'
      ],
      default: 'nano'
    },
    {
      type: 'list',
      name: 'port',
      message: 'Choose a port',
      choices: ports.map((el) => {
        return el.path;
      }),
      default: null
    },
    {
      type: 'input',
      name: 'address',
      message: 'Choose an I2C address [optional]',
      default: null,
      when: (answers) => {
        return !answers.firmata && answers.firmware.indexOf('Firmata') === -1;
      }
    }
  ];

  return questions;
};


Inquire.prototype.promptQuestions = function(ports) {
  // lead the user through some questions to help choose and then
  // flash the firmware to the board.

  if (typeof(ports) == 'undefined') {
    throw new Error('No ports were provided to select from');
  }

  inquirer.prompt(this.questions(ports))
    .then((answers) => {
      const firmware = answers.firmware;
      const opts = {
        board : answers.avr,
        port : answers.port,
        address : answers.address,
        firmata : answers.firmataType || answers.firmata
      };

      if (this.callback && typeof this.callback === 'function') {
        this.callback(firmware, opts);
      }
    });
};

module.exports = Inquire;
