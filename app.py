
from flask import Flask, render_template, jsonify
from datetime import datetime
import random

app = Flask(__name__)

# Initial application state
state = {
    "status": "Healthy",
    "cpu": 24,
    "memory": 38,
    "latency": 45,
    "errors": 0,
    "active_failure": "None"
}

history = []


def add_log(message, event_type):
    history.insert(0, {
        "time": datetime.now().strftime("%H:%M:%S"),
        "message": message,
        "type": event_type
    })

    # Keep the latest 30 events
    del history[30:]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/status")
def get_status():
    return jsonify({
        "state": state,
        "history": history
    })


@app.route("/api/simulate/<scenario>", methods=["POST"])
def simulate(scenario):

    if state["active_failure"] != "None":
        return jsonify({
            "success": False,
            "message": "Recover the current failure first."
        }), 409

    if scenario == "cpu":
        state.update({
            "status": "Degraded",
            "cpu": random.randint(90, 99),
            "memory": random.randint(40, 55),
            "latency": random.randint(250, 450),
            "errors": random.randint(2, 8),
            "active_failure": "CPU Overload"
        })

    elif scenario == "memory":
        state.update({
            "status": "Degraded",
            "cpu": random.randint(40, 60),
            "memory": random.randint(90, 98),
            "latency": random.randint(180, 350),
            "errors": random.randint(2, 6),
            "active_failure": "Memory Pressure"
        })

    elif scenario == "crash":
        state.update({
            "status": "Down",
            "cpu": 0,
            "memory": 0,
            "latency": 0,
            "errors": 100,
            "active_failure": "Application Failure"
        })

    elif scenario == "network":
        state.update({
            "status": "Degraded",
            "cpu": random.randint(25, 45),
            "memory": random.randint(35, 55),
            "latency": random.randint(1000, 2500),
            "errors": random.randint(5, 15),
            "active_failure": "Network Delay"
        })

    else:
        return jsonify({
            "success": False,
            "message": "Unknown failure scenario."
        }), 400

    add_log(
        f"{state['active_failure']} simulation triggered",
        "danger"
    )

    return jsonify({
        "success": True,
        "message": f"{state['active_failure']} simulated.",
        "state": state
    })


@app.route("/api/recover", methods=["POST"])
def recover():

    if state["active_failure"] == "None":
        return jsonify({
            "success": False,
            "message": "Application is already healthy."
        }), 400

    previous_failure = state["active_failure"]

    state.update({
        "status": "Healthy",
        "cpu": random.randint(15, 30),
        "memory": random.randint(25, 40),
        "latency": random.randint(30, 60),
        "errors": 0,
        "active_failure": "None"
    })

    add_log(
        f"{previous_failure} recovered successfully",
        "success"
    )

    return jsonify({
        "success": True,
        "message": "Application recovered successfully.",
        "state": state
    })


if __name__ == "__main__":
    add_log("ChaosLite application started", "success")
    app.run(debug=False, host="0.0.0.0", port=5000)