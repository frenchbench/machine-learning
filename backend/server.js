const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const amqp = require('amqplib/callback_api');


const port = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);

const ioOptions = {
  //path: '/socket.io', // default value
  //origins: '*',       // CORS * * *
  serveClient: false,   // serve client files

  // below are engine.IO options ---
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
  transports: [ //	transports to allow connections to
    'websocket', 'polling' // swapped to give ppiority to websocket
  ],
};

console.log('socketIo ...');
const io = socketIo(server, ioOptions);// WebSocket * * *
console.log('socketIo ... ready');


let queueChannel = null;
const queueName_DO = 'TASK_DO';
const queueName_INFO = 'TASK_INFO';
const queueName_DONE = 'TASK_DONE';

let sockets = {};
let tasks = {};
let lastTaskId = 0;

function socketInfo(socket){
  return (socket && (typeof socket === 'object') && ('id' in socket)
    ? '[socket.id: ' + socket.id + ']' : socket);
}

function socketAuthor(socket){
  return (socket && (typeof socket === 'object') && ('id' in socket)
    ? '[socket.id: ' + socket.id + ']' : socket);
}

function socketMessage(socket = null, msgData = null, type = 'CHAT'){
  return {
    time: new Date(),
    author: socketAuthor(socket),
    data: msgData,
    type,
  };
}

function taskInfoHandler (msgObj, channel = null) {
  console.log('taskInfoHandler', msgObj, channel);
  const msgObjExt = socketMessage('[worker]', msgObj);
  if (io) {
    console.log('io.emit TASK_INFO', msgObjExt);
    io.emit('TASK_INFO', msgObjExt);// inform all sockets
  }
}

function taskDoneHandler (msgObj, channel = null) {
  console.log('taskDoneHandler', msgObj, channel);
  const msgObjExt = socketMessage('[worker]', msgObj);
  if (io) {
    console.log('io.emit TASK_DONE', msgObjExt);
    io.emit('TASK_DONE', msgObjExt);// inform all sockets
  }
}

// AMQP - start -------------------------------------------------------------------------
console.log('amqp.connect ...');
amqp.connect('amqp://localhost', (err, conn) => {
  console.log('amqp.connect ... ready');

  console.log('amqp.connection.createChannel ...');
  conn.createChannel((err, ch) => {
    console.log('amqp.connection.createChannel ... ready');
    // make sure queues are declared
    ch.assertQueue(queueName_DO, { durable: false });
    ch.assertQueue(queueName_INFO, { durable: false });
    ch.assertQueue(queueName_DONE, { durable: false });

    // set global variable for queue channel
    queueChannel = ch;

    ch.consume(queueName_INFO, (msg) => {
      const msgText = msg.content.toString();
      const msgObj = JSON.parse(msgText);
      console.log('amqp.channel.consume', msgObj);
      taskInfoHandler(msgObj, queueName_INFO);
    }, { noAck: true });

    ch.consume(queueName_DONE, (msg) => {
      const msgText = msg.content.toString();
      const msgObj = JSON.parse(msgText);
      console.log('amqp.channel.consume', msgObj);
      taskDoneHandler(msgObj, queueName_DONE);
    }, { noAck: true });

  });

});
// AMQP - end ===========================================================================


// HTTP API - start ---------------------------------------------------------------------
app.get('/', (req, res) => {// it will not work behind reverse-proxy
  console.log('app.get /');
  res.json({ data: 'Hello World!' });
});

app.get('/api', (req, res) => { // API * * *
  console.log('app.get /api');
  res.json({ data: 'hello' });
});
// HTTP API  - end ======================================================================


// WEBSOCKET comm - start ---------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('io.on connection', socketInfo(socket));

  // register socket
  sockets['id-' + socket.id] = socket;

  socket.on('disconnect', () => {
    console.log('socket.on disconnect', socketInfo(socket));
    // unregister socket
    delete sockets['id-' + socket.id];
  });

  socket.on('TASK_DO', function (taskObj) {
    console.log('socket.on TASK_DO', typeof taskObj, taskObj, socketInfo(socket));

    // generate new task ID
    const id = 'task-' + String(++lastTaskId).padStart(6, '0');// '000123' TODO: use UUID maybe
    const status = 'published';
    const published = new Date();

    // publish extended task object to workers
    const taskObjExt = Object.assign({}, taskObj, { id, status, published });
    tasks[id] = taskObjExt;// register task

    console.log('publisher.publish TASK_DO', taskObjExt);
    //publisher.publish('TASK_DO', JSON.stringify(task));
    queueChannel.sendToQueue(queueName_DO, Buffer.from(JSON.stringify(taskObjExt)));

    // inform socket clients
    //const msgObj = socketMessage(socket, { id, status, published });// do not send everything back, maybe?
    const msgObj = socketMessage(socket, taskObjExt);
    console.log('socket.emit TASK_INFO', msgObj);
    io.emit('TASK_INFO', msgObj, 'TASK');// inform all sockets
  });

  // user wants to send a message to everyone
  socket.on('CHAT_SEND', function(msgText){
    console.log('socket.on CHAT_SEND', typeof msgText, msgText, socketInfo(socket));
    const msgObj = socketMessage(socket, msgText);
    io.emit('CHAT_RECEIVE', msgObj, 'TASK'); // inform all sockets
  });

  // greet new socket
  const msgObj = socketMessage(socket, 'world');
  console.log('socket.emit HELLO ', msgObj);
  socket.emit('HELLO', msgObj);// inform only this socket

});
// WEBSOCKET comm - end =================================================================


// start listening on HTTP port
server.listen(port, () => {
  console.log('server.listen', port);
});
