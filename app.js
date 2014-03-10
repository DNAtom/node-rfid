
/**
 * Module dependencies.
 */

var express     = require('express');
var routes      = require('./routes');
var user        = require('./routes/user');
var http        = require('http');
var path        = require('path');

var serialport  = require('serialport'),
    PORT        = '/dev/ttyUSB0',
    serial_open = false,
    serial_opts = { 'baudrate':   9600, 
                    'parser':     serialport.parsers.readline('\n') };

serial = new serialport.SerialPort(PORT, serial_opts); 


var app = express(),
    http = require('http');
    server = http.createServer(app),
    io = require('socket.io').listen(server);

var config = require('./config.js');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app),
    io = require('socket.io').listen(server, { 'log': false });

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// open serial port and then process the barcode
serial.on('open', function() {
    serial_open = true;
    console.log('Opened serial port ', PORT);
    serial.on('data', function(data) {
        // test if it looks like a badge 
        if((/6A[A-z0-9]*/).test(data)) {
            data = data.match(/6A[A-z0-9]*/)[0];
            console.log('Data: ' + data + ' length: ' + data.length);
            io.sockets.emit('event', 
                config.badges.filter(function(item) { return (item.id == data) ? true : false; })
            )
        }
    });
});

function badgeNameByID(id) {
    
}

// handle serial port closing
serial.on('close', function() {
    serial.open = false;
    console.log('CLosed serial port ', PORT);
})

// real time stuff

function emit_current_state(socket) {
    io.sockets.emit('current_state', { 'doors': config.doors });
};

io.sockets.on('connection', function(socket) { emit_current_state(socket) });
io.sockets.on('update', function(socket) { emit_current_state(socket) });

