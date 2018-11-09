# machine-learning

React app, Node.js HTTP + WebSocket server, RabbitMQ for queues, Python worker for long-running machine learning tasks

## Frontend

### Requirements

* Nginx
* Node.js
* React
* Socket.io client
* Semantic UI
* Yarn

### Installation

* npm install -g yarn
* yarn install
* yarn build
* Refer to sample nginx config file

## Backend

### Requirements

* Node.js
* Express.js
* Socket.io
* AMQP library
* RabbitMQ server
* Python 3

### Installation

* npm install
* terminal 1: npm run server
* terminal 2: npm run worker
