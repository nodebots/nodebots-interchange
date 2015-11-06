var events = require("events");
var parsers = require("serialport").parsers; // used for parser
var SerialPort = require("serialport").SerialPort;
var util = require("util");


function Client() {

    //events.EventEmitter.call(this);
    var port_address = null;
    var sp_open = false;
    var sp_timeout = null;
    
    var state_init = function(data) {
        // initialising the connection, waits for the magic chars to come out
        if (data.indexOf(">>") >=0) {
            // now we move to just writing anything from the serial line out.
            current_state = state_write;
            this.emit("ready");
        }
    }.bind(this);

    var state_write = function(data) {
        // just passes the data up to anything that wants to listen for it.
        this.emit("data", data);
        // clear any callbacks
        current_callback = null;
    }.bind(this);
    
    var state_dump = function(data) {
        // waits for the state dump to come back and then parses the json and 
        //
        current_state = state_write;
        try {
            var dump = JSON.parse(data);
        } catch (err) {
            if (current_callback != null) {
                current_callback(e);
            }
        }
        
        if (current_callback != null) {
            current_callback(null, dump);
        }
    }

    var current_state = state_init;
    var current_callback = null;

    this.serialport = null;

    this.get_info = function(cb) {
        this.serialport.write("DUMP\n");
        current_state = state_dump;
        current_callback = cb;
    };

    this.close = function() {
        this.serialport.close();
    };

    Object.defineProperties(this, {
        "port": {
            set: function(p) {
                if (p != undefined) {
                    // set the port here.
                    this.serialport = new SerialPort(p, {
                        baudrate: 9600,
                        parser: parsers.readline("\n")
                    });
              
                    sp_timeout = setTimeout(function() {
                        if (current_state == state_init) {
                            this.emit("error", new Error("Serialport timeout"));
                        }
                    }.bind(this), 4000);
                    
                    // create handlers for the various serial port actions.
                    this.serialport.on("open", function(error) {
                        if (error) {
                            console.log(error);
                        }
                        port_address = p;
                        this.emit("connected");
                    }.bind(this));

                    this.serialport.on("error", function(err) {
                        console.log("error");
                        this.emit("error", err);
                    }.bind(this));

                    this.serialport.on("data", function(data) {
                        current_state(data);
                    }.bind(this));


                }
            },
            get: function() {
                return port_address;
            },
        },
    });
}

util.inherits(Client, events.EventEmitter);
module.exports.Client = Client;
