#!/usr/bin/env python3
import pika
import json

# configuration
host = 'localhost'
queue1 = 'TASK_DO'
queue2 = 'TASK_DONE'
no_ack = True

# global channel variable
channel = None


def callback(ch, method, properties, body):
  global channel
  msg_obj_in = json.loads(body)
  print("callback received %r" % body)

  print("working on task")
  output = 0

  if msg_obj_in['type'] == 'add':
    output = 123 + int(msg_obj_in['input'])

  print("inform task done")
  msg_obj_out = {'task': msg_obj_in, 'status': 'done', 'output': output}
  msg_text = json.dumps(msg_obj_out)
  channel.basic_publish(exchange='', routing_key=queue2, body=msg_text)
# end def callback


def main():
  global channel

  print("open a connection to queue server")
  host_param = pika.ConnectionParameters(host)
  connection = pika.BlockingConnection(host_param)

  print("open a channel")
  channel = connection.channel()

  print("declare queues")
  channel.queue_declare(queue1)
  channel.queue_declare(queue2)

  print("listen to queue1 for messages")
  channel.basic_consume(callback, queue1, no_ack)

  print('waiting for messages... to exit press CTRL+C')
  channel.start_consuming()
# end def main


if __name__ == '__main__':
  main()
