const events = require('events');
const parsers = require('serialport').parsers; // used for parser
const SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');
const util = require('util');

const NL = 0x0a;

function Client() {
  let port_address = null;
  const sp_open = false;
  // const sp_timeout = null;

  let current_state = null;
  let current_callback = null;

  const state_write = (data) => {
    // just passes the data up to anything that wants to listen for it.
    this.emit('data', data);
    // clear any callbacks
    current_callback = null;
  };

  const state_init = (data) => {
    // initialising the connection, waits for the magic chars to come out
    if (data.indexOf('>>') >=0) {
      // now we move to just writing anything from the serial line out.
      current_state = state_write;
      this.emit('ready');
    }
  };

  const state_dump = (data) => {
    // waits for the state dump to come back and then parses the json and
    //
    current_state = state_write;
    let dump;
    try {
      dump = JSON.parse(data);
    } catch (err) {
      if (current_callback != null) {
        current_callback(err);
      }
    }

    if (current_callback != null) {
      current_callback(null, dump);
    }
  };

  current_state = state_init;

  this.serialport = null;

  this.get_info = (cb) => {
    this.serialport.write('DUMP\n');
    current_state = state_dump;
    current_callback = cb;
  };

  this.set_details = async(data, cb) => {
    // sets the details of the firmware onto the device

    current_state = state_write;

    await new Promise((resolve, reject) => {
      this.serialport.write('CLR\n');
      resolve('CLR');
    }).then(() => {
      const s = 'FID ' + data.firmwareID + '\n';
      this.serialport.write(s);
      return ('FID');
    }).then(() => {
      this.serialport.write('CID ' + data.creatorID + '\n');
      return 'CID';
    }).then(() => {
      this.serialport.write('I2C ' + data.i2c_address + ' ' + data.use_custom_address + '\n');
      return 'I2C';
    }).then(async() => {
      // give the serialport time to finish executing before you close out
      await setTimeout(() => {}, 20);
      cb();
    }).catch(err => {
      throw err;
    });
  };

  this.close = () => {
    if (this.open) {
      this.serialport.close();
    }
  };

  Object.defineProperties(this, {
    'open': {
      get() {
        // gives back whether the serialport is open or not
        let open = false
        if (this.serialport) {
          open = this.serialport.isOpen;
        }
        return open;
      }
    },
    'port': {
      set(p) {
        if (p != undefined) {
          // set up the port here.
          const parser = new ReadLine();

          const opts = {baudRate: 9600};
          this.serialport = new SerialPort(p, opts, (err) => {
            if (err) {
              this.emit('error', err);
            }
          });

          this.serialport.pipe(parser);

          // create handlers for the various serial port actions.
          this.serialport.on('open', () => {
            // once connection is open, emit that but then this will do nothing
            // further. After data comes back in from the SP then the data will
            // flow through the parser data event instead.
            port_address = p;
            this.emit('connected');
          });

          // These are catch all scenarios to surface an error in a low level
          // library. No need for explicit tests.
          /* istanbul ignore next */
          this.serialport.on('error', (err) => {
            this.emit('error', err);
          });

          /* istanbul ignore next */
          parser.on('error', (err) => {
            this.emit('error', err);
          });

          parser.on('data', (data) => current_state(data));
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
