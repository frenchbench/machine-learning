#!/usr/bin/env python3
import pika
import json
import datetime

# configuration
host = 'localhost'
queue1 = 'TASK_DO'
queue2 = 'TASK_INFO'
queue3 = 'TASK_DONE'
no_ack = True

# global channel variable
channel = None


def now():
  now = datetime.datetime.now()
  return now.isoformat()
# end def now


def callback(ch, method, properties, body):
  global channel
  msg_obj_in = json.loads(body.decode('utf-8'))
  print("callback received %r" % body)

  msg_obj_out = msg_obj_in.copy()
  msg_obj_out.update({'status': 'started', 'started': now()})
  msg_text = json.dumps(msg_obj_out)
  print("inform task in-progress", msg_text)
  channel.basic_publish(exchange='', routing_key=queue2, body=msg_text)

  print("working on long-running task ...")
  output = 0

  if msg_obj_in['type'] == 'worker1':
    output = 123 + int(msg_obj_in['input'])

  print("working on long-running task ... done")

  msg_obj_out = msg_obj_in.copy()
  msg_obj_out.update({'status': 'ended', 'ended': now(), 'output': output})
  msg_text = json.dumps(msg_obj_out)
  print("inform task done", msg_text)
  channel.basic_publish(exchange='', routing_key=queue3, body=msg_text)
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
