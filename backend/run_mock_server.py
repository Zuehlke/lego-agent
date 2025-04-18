# /// script
# dependencies = [
#   "flask",
#   "flask-cors"
# ]
# ///

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)

@app.route('/list_devices', methods=['GET'])
def list_devices():
    print('Called list_devices')
    return jsonify(['Lights', 'Motors', 'Speaker', 'Distance'])

@app.route('/set_lights', methods=['POST'])
def set_lights():
    print(f'Called set_lights with {request.json}')
    return jsonify({'status': 'success'})

@app.route('/set_motors', methods=['POST'])
def set_motors():
    print(f'Called set_motors with {request.json}')
    return jsonify({'status': 'success'})

@app.route('/set_head', methods=['POST'])
def set_head():
    print(f'Called set_head with {request.json}')
    return jsonify({'status': 'success'})

@app.route('/speak', methods=['POST'])
def speak():
    print(f'Called speak with {request.json}')
    return jsonify({'status': 'success'})

@app.route('/get_distance', methods=['GET'])
def get_distance():
    print('Called get_distance')
    return jsonify({'distance': 42})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
