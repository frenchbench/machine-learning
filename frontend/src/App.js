import React, { Component } from 'react';
import { Grid, Form, Select, TextArea, Button, List, Table } from 'semantic-ui-react';
import socketIOClient from 'socket.io-client';
import MainLayout from './MainLayout';

class App extends Component {

  constructor(props){
    console.log('App.constructor');
    super(props);
    this.state = {
      task_type: 'worker1',
      task_input: '',
      messages: [],
      message: '',
      tasks: {},
    };
    this.socket = null;
  }

  componentDidMount(){
    console.log('App.componentDidMount');
    this.socket = socketIOClient();
    if (this.socket) {
      this.socket.on('HELLO', this.onSocketHello);
      this.socket.on('CHAT_RECEIVE', this.onSocketReceiveChat);
      this.socket.on('TASK_INFO', this.onSocketTaskInfo);
      this.socket.on('TASK_DONE', this.onSocketTaskDone);
    }
  }

  onSocketHello = (msgObj) => {
    console.log('socket.on HELLO', msgObj);
    const messages = [...this.state.messages];
    messages.push(Object.assign({ type: 'HELLO' }, msgObj));
    this.setState({ messages });
  };

  onSocketReceiveChat = (msgObj) => {
    console.log('socket.on CHAT_RECEIVE', msgObj);
    const messages = [...this.state.messages];
    messages.push(Object.assign({ type: 'CHAT' }, msgObj));
    this.setState({ messages });
  };

  onSocketTaskInfo = (msgObj) => {
    console.log('socket.on TASK_INFO', msgObj);
    const taskObj = msgObj.data;
    let tasks = {...this.state.tasks};
    tasks[taskObj.id] = taskObj;
    this.setState({ tasks });
  };

  onSocketTaskDone = (msgObj) => {
    console.log('socket.on TASK_DONE', msgObj);
    const taskObj = msgObj.data;
    let tasks = {...this.state.tasks};
    tasks[taskObj.id] = taskObj;
    this.setState({ tasks });
  };

  socketSendChat = (msgText) => {
    console.log('socket.emit CHAT_SEND', msgText);
    if (this.socket) {
      this.socket.emit('CHAT_SEND', msgText);// sending string
    }
  };

  socketSendTask = (type, input) => {
    console.log('socket.emit TASK_DO', type, input);
    if (this.socket) {
      this.socket.emit('TASK_DO', { type, input });// sending object
    }
  };

  componentWillUnmount() {
    console.log('App.componentWillUnmount');
    try {
      if (this.socket) {
        this.socket.disconnect();
      }
    } catch (err) {
      // ignore
    }
    this.socket = null;
  }

  onChangeMessage = (evt) => {
    this.setState({ message: evt.target.value });
  };

  onClickSend = (evt) => {
    this.socketSendChat(this.state.message);
    this.setState({ message: '' });
  };

  onChangeTaskType = (evt, { value }) => {
    this.setState({ task_type: value });
  };

  onChangeTaskInput = (evt, { value }) => {
    this.setState({ task_input: value });
  };

  onSubmitTaskForm = (evt) => {
    console.log('App.onSubmitForm');
    evt.preventDefault();
    const { task_type, task_input } = this.state;
    this.socketSendTask(task_type, task_input);
    //this.setState({ task_input: '' });// reset input?
  };

  renderMessages(messages){
    return messages.map((msgObj, idx) => {
      const info = typeof msgObj.data === 'string' ? msgObj.data : JSON.stringify(msgObj.data);
      return (
        <List.Item key={idx}>
          <List.Icon name='github' verticalAlign='middle' />
          <List.Content>
            <List.Header as='a'>{info}</List.Header>
            <List.Description as='a'>{msgObj.time} {msgObj.author}</List.Description>
          </List.Content>
        </List.Item>
      );
    });
  }

  renderTasks(tasks){
    return Object.entries(tasks).map(([taskId, taskObj], idx) => {
      const { id, type, status, published, started, ended, input, output } = taskObj;
      return (
        <Table.Row key={idx}>
          <Table.Cell>{type}</Table.Cell>
          <Table.Cell>{id}</Table.Cell>
          <Table.Cell>{status}</Table.Cell>
          <Table.Cell>{published}</Table.Cell>
          <Table.Cell>{started}</Table.Cell>
          <Table.Cell>{ended}</Table.Cell>
          <Table.Cell>{input}</Table.Cell>
          <Table.Cell>{output}</Table.Cell>
        </Table.Row>
      );
    });
  }

  render() {
    const { messages, message, tasks } = this.state;
    const messageItems = this.renderMessages(messages);
    const taskRows = this.renderTasks(tasks);

    const taskOptions = [
      { key: 'chat', value: 'chat', text: 'Chat' },
      { key: 'worker1', value: 'worker1', text: 'Worker 1' },
      { key: 'worker2', value: 'worker2', text: 'Worker 2' },
    ];

    return (
      <div className='app'>

        <MainLayout>

          <Grid>
            <Grid.Row>
              <Grid.Column width={12}>

                <Form onSubmit={this.onSubmitTaskForm} name='task-form'>
                  <Form.Group widths='equal'>
                    <Form.Field control={Select} label='Task' options={taskOptions}
                                placeholder='Task' onChange={this.onChangeTaskType} />
                  </Form.Group>
                  <Form.Field control={TextArea} label='Input'
                              placeholder='Please type...' onChange={this.onChangeTaskInput} />
                  <Form.Field control={Button}>Submit</Form.Field>
                </Form>

                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Type</Table.HeaderCell>
                      <Table.HeaderCell>ID</Table.HeaderCell>
                      <Table.HeaderCell>Status</Table.HeaderCell>
                      <Table.HeaderCell>Published</Table.HeaderCell>
                      <Table.HeaderCell>Started</Table.HeaderCell>
                      <Table.HeaderCell>Ended</Table.HeaderCell>
                      <Table.HeaderCell>Input</Table.HeaderCell>
                      <Table.HeaderCell>Output</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {taskRows}
                  </Table.Body>
                </Table>

              </Grid.Column>
              <Grid.Column width={4}>

                <div className='message-new'>
                  <label>Your message:</label>
                  <input onChange={this.onChangeMessage} value={message} type='text' name='message' />
                  <button onClick={this.onClickSend} type='button'>send</button>
                </div>

                <div className='message-list'>
                  <label>Messages</label>

                  <List divided relaxed>
                    {messageItems}
                  </List>
                </div>

              </Grid.Column>
            </Grid.Row>
          </Grid>







        </MainLayout>

      </div>
    );
  }
}

export default App;
