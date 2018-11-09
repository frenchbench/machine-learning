#!/usr/bin/env python3
import pika
import json
import datetime
import pandas as pd
from pandas.compat import StringIO
#from io import StringIO


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


# sum all numbers we can recognize in string input
def worker1(inp, options = ''):
  arr = [int(s) for s in str(inp).split() if s.isdigit()]
  output = sum(arr)
  print("worker1 => ", output)
  return output
# end def worker1


# calculate sum of values in 1st column
def worker2(inp, options = ''):
  output = 0

  # fix new line chars
  txt = str(inp).replace('\\n', '\n')
  csv = StringIO(txt)
  # load data frame with row 0 as header
  df = pd.read_csv(csv, sep=',\s*', quotechar='"', escapechar='\\', encoding='utf-8', engine='python')
  print("worker2: shape")
  print(df.shape)
  print("worker2: data frame")
  print(df)
  print("worker2: data frame columns")
  print(df.columns)
  print("worker2: data frame columns values")
  print(df.columns.values)
  print("worker2: data frame iloc 0")
  print(df.iloc[0])
  print("worker2: data frame col1 name")
  col1 = df.columns.values[0]
  print(col1)
  print("worker2: data frame col1")
  print(df[col1])
  output = df[col1].sum()

  print("worker2 => ", output)
  return int(str(output))
# end def worker2


def callback(ch, method, properties, body):
  global channel
  msg_obj_in = json.loads(body.decode('utf-8'))
  print("callback received %r" % body)

  msg_obj_out1 = msg_obj_in.copy()
  msg_obj_out1.update({'status': 'started', 'started': now()})
  msg_text = json.dumps(msg_obj_out1)
  print("inform task in-progress", msg_text)
  channel.basic_publish(exchange='', routing_key=queue2, body=msg_text)

  print("working on long-running task ...")
  output = 0

  if msg_obj_in['type'] == 'worker1':
    output = worker1(msg_obj_in['input'], msg_obj_in['options'])

  if msg_obj_in['type'] == 'worker2':
    output = worker2(msg_obj_in['input'], msg_obj_in['options'])


  print("working on long-running task ... done")

  msg_obj_out2 = msg_obj_out1.copy()
  msg_obj_out2.update({'status': 'ended', 'ended': now(), 'output': output})
  msg_text = json.dumps(msg_obj_out2)
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
