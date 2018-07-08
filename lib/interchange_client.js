const async = require('async');
const colors = require('colors');
const events = require('events');
const parsers = require('serialport').parsers; // used for parser
const SerialPort = require('serialport');
const util = require('util');

const NL = 0x0a;

function Client() {
  // events.EventEmitter.call(this);
  let port_address = null;
  const sp_open = false;
  let sp_timeout = null;

  let current_state = null; 
  let current_callback = null;

  const state_write = function(data) {
    // just passes the data up to anything that wants to listen for it.
    console.log(data);
    this.emit('data', data);
    // clear any callbacks
    current_callback = null;
  }.bind(this);

  const state_init = function(data) {
    // initialising the connection, waits for the magic chars to come out
    if (data.indexOf('>>') >=0) {
      // now we move to just writing anything from the serial line out.
      current_state = state_write;
      this.emit('ready');
    }
  }.bind(this);

  const state_dump = function(data) {
    // waits for the state dump to come back and then parses the json and
    //
    current_state = state_write;
    try {
      const dump = JSON.parse(data);
    } catch (err) {
      if (current_callback != null) {
        current_callback(e);
      }
    }

    if (current_callback != null) {
      current_callback(null, dump);
    }
  };

  current_state = state_init;

  this.serialport = null;

  this.get_info = function(cb) {
    this.serialport.write('DUMP\n');
    current_state = state_dump;
    current_callback = cb;
  };

  this.set_details = function(data, cb) {
    console.info('Setting firmware details'.magenta);

    current_state = state_write;

    async.series([
      function(callback) {
        this.serialport.write('CLR\n');
        callback(null, 'erase');
      }.bind(this),
      function(callback) {
        const s = 'FID ' + data.firmwareID + '\n';
        this.serialport.write(s);
        callback(null, 'FID');
      }.bind(this),
      function(callback) {
        this.serialport.write('CID ' + data.creatorID + '\n');
        callback(null, 'CID');
      }.bind(this),
      function(callback) {
        this.serialport.write('I2C ' + data.i2c_address + ' ' + data.use_custom_address + '\n');
        // this is a hack - blame @jacobrosenthal as I pinched it
        // for how uploads are managed in STK500 loader.
        // Basically delay return on this just to give it time to
        // finish executing or the serial port will get closed.
        setTimeout(function() {
          callback(null, 'I2C')
        }, 20);
      }.bind(this)
    ],
    function(err, results) {
      cb();
    });
  };

  this.close = function() {
    this.serialport.close();
  };

  Object.defineProperties(this, {
    'port': {
      set(p) {
        if (p != undefined) {
          // set the port here.
          this.serialport = new SerialPort(p, {
            baudrate: 9600,
            parser: parsers.readline('\n')
          });

          sp_timeout = setTimeout(function() {
            if (current_state == state_init) {
              this.emit('error', new Error('Serialport timeout'));
            }
          }.bind(this), 4000);

          // create handlers for the various serial port actions.
          this.serialport.on('open', function(error) {
            if (error) {
              console.error(error);
            }
            port_address = p;
            this.emit('connected');
          }.bind(this));

          this.serialport.on('error', function(err) {
            console.error('error');
            this.emit('error', err);
          }.bind(this));

          this.serialport.on('data', function(data) {
            current_state(data);
          }.bind(this));
        }
      },
      get() {
        return port_address;
      }
    }
  });
}

util.inherits(Client, events.EventEmitter);
module.exports.Client = Client;
