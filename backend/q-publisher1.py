#!/usr/bin/env python3
import pika
import json

host = 'localhost'
queue = 'TASK_DO'
key = queue


def main():
  host_param = pika.ConnectionParameters(host)
  connection = pika.BlockingConnection(host_param)
  channel = connection.channel()
  channel.queue_declare(queue)

  msgObj = {'id': '2', 'type': 'worker1', 'input': '1 2 3'}
  msgText = json.dumps(msgObj)
  channel.basic_publish(exchange='', routing_key=key, body=msgText)
  print("sent", msgText)


  msgObj = {'id': '1', 'type': 'worker1', 'input': '10 11 12 13'}
  msgText = json.dumps(msgObj)
  channel.basic_publish(exchange='', routing_key=key, body=msgText)
  print("sent", msgText)

  connection.close()
# end def main


if __name__ == '__main__':
  main()
