import React, { Component } from 'react';
import { Grid, Form, Select, TextArea, Button, List } from 'semantic-ui-react';
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

  onSocketTaskInfo = (infoObj) => {
    console.log('socket.on TASK_INFO', infoObj);
    const messages = [...this.state.messages];
    messages.push(Object.assign({ type: 'TASK_INFO' }, infoObj));
    this.setState({ messages });
  };

  onSocketTaskDone = (infoObj) => {
    console.log('socket.on TASK_DONE', infoObj);
    const messages = [...this.state.messages];
    messages.push(Object.assign({ type: 'TASK_DONE' }, infoObj));
    this.setState({ messages });
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
    this.setState({ task_input: '' });// reset input
  };

  render() {
    const { messages, message } = this.state;
    const messageItems = messages.map((msgObj, idx) => {
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
