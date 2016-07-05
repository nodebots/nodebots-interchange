var inquirer = require('inquirer');
var Interchange = require('../lib/interchange');
var Inquire = require('../lib/inquire');
var firmwares = require('../lib/firmwares.json').firmwares;

var Inquire = function (cb) {

    this.interchange = new Interchange();

    this.callback = cb;

    this.interchange.get_ports(function (err, ports) {

        if (err) {
            console.error(err);
            return;
        }

        this.promptQuestions(ports);

    }.bind(this));

};

Inquire.prototype.promptQuestions = function (ports) {

    var questions = [
        {
            type: "list",
            name: "firmware",
            message: "Choose a firmware",
            choices: this.interchange.firmwares.map(function (el) {
                return el.name
            })
        },
        {
            type: "confirm",
            name: "firmata",
            message: "Install firmata version?",
            default: function (answers) {
                return answers.firmware.indexOf('Firmata') > -1;
            },
            when: function (answers) {
                var firmware = firmwares.filter(function(obj) {
                    return obj.name === answers.firmware
                });

                return firmware.length && firmware[0].firmata && answers.firmware.indexOf('Firmata') === -1;
            }
        },
        {
            type: "input",
            name: "firmataType",
            message: "Firmata name [optional]",
            default: null,
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
                "pro-mini",
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
            default: null,
            when: function (answers) {
                return !answers.firmata && answers.firmware.indexOf('Firmata') === -1;
            }
        }
    ];

    inquirer.prompt(questions).then(function(answers) {
        var firmware = answers.firmware;
        var opts = {
            board : answers.avr,
            port : answers.port,
            address : answers.address,
            firmata : answers.firmataType || answers.firmata
        };

        if (this.callback && typeof this.callback === 'function') {
            this.callback(firmware, opts);
        }
    }.bind(this));

};

module.exports = Inquire;
