#!/usr/bin/env python3

from flask import Flask, request, jsonify
from robot_server import RobotServer

app = Flask(__name__)
robot = RobotServer()

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = app.make_response('')
        response.status_code = 200
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/list_devices', methods=['GET'])
def list_devices():
    try:
        devices = robot.get_device_list()
        return jsonify([device.value for device in devices])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/set_lights', methods=['POST'])
def set_lights():
    try:
        data = request.json
        left_color = data.get('left_color')
        right_color = data.get('right_color')
        robot.set_lights(left_color, right_color)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/set_motors', methods=['POST'])
def set_motors():
    try:
        data = request.json
        left_speed = data.get('left_speed')
        right_speed = data.get('right_speed')
        robot.set_motors(left_speed, right_speed)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.json
        text = data.get('text')
        robot.speak(text)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_distance', methods=['GET'])
def get_distance():
    try:
        distance = robot.get_distance()
        return jsonify({'distance': distance})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
