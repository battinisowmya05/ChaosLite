
const cpuValues = [];
const memoryValues = [];
const labels = [];

const ctx = document.getElementById("resourceChart");

const resourceChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: labels,
        datasets: [
            {
                label: "CPU %",
                data: cpuValues,
                borderColor: "#60a5fa",
                tension: 0.3
            },
            {
                label: "Memory %",
                data: memoryValues,
                borderColor: "#a78bfa",
                tension: 0.3
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: { color: "#94a3b8" }
            },
            x: {
                ticks: { color: "#94a3b8" }
            }
        },
        plugins: {
            legend: {
                labels: { color: "#f1f5f9" }
            }
        }
    }
});

function updateDashboard(data) {
    const s = data.state;

    document.getElementById("cpu").textContent = s.cpu + "%";
    document.getElementById("memory").textContent = s.memory + "%";
    document.getElementById("latency").textContent = s.latency + " ms";
    document.getElementById("errors").textContent = s.errors;

    const status = document.getElementById("status");
    status.textContent = "● " + s.status.toUpperCase();

    status.style.background =
        s.status === "Healthy" ? "#064e3b" :
        s.status === "Degraded" ? "#78350f" : "#7f1d1d";

    status.style.color =
        s.status === "Healthy" ? "#6ee7b7" :
        s.status === "Degraded" ? "#fcd34d" : "#fca5a5";

    let health = 100;

    if (s.status === "Degraded") health = 45;
    if (s.status === "Down") health = 0;

    document.getElementById("healthText").textContent = health + "%";
    document.getElementById("healthLabel").textContent =
        health === 100 ? "Excellent" :
        health === 0 ? "Application Down" : "Degraded";

    document.getElementById("healthCircle").style.borderColor =
        health === 100 ? "#10b981" :
        health === 0 ? "#ef4444" : "#f59e0b";

    document.getElementById("activeFailure").textContent =
        s.active_failure === "None" ?
        "No active failures" : s.active_failure;

    const now = new Date().toLocaleTimeString();

    labels.push(now);
    cpuValues.push(s.cpu);
    memoryValues.push(s.memory);

    if (labels.length > 12) {
        labels.shift();
        cpuValues.shift();
        memoryValues.shift();
    }

    resourceChart.update();

    document.getElementById("history").innerHTML =
        data.history.length ?
        data.history.map(item => `
            <div class="log ${item.type}">
                ${item.message}
                <small>${item.time}</small>
            </div>
        `).join("") :
        '<p class="description">No experiments yet.</p>';
}

async function refreshStatus() {
    try {
        const response = await fetch("/api/status");
        if (!response.ok) throw new Error("Status request failed");

        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        document.getElementById("message").textContent =
            "Unable to connect to backend.";
    }
}

async function simulate(scenario) {
    try {
        const response = await fetch(`/api/simulate/${scenario}`, {
            method: "POST"
        });

        const data = await response.json();

        document.getElementById("message").textContent = data.message;

        if (data.state) {
            await refreshStatus();
        }

    } catch (error) {
        document.getElementById("message").textContent =
            "Simulation failed. Check backend.";
    }
}

async function recoverApp() {
    try {
        const response = await fetch("/api/recover", {
            method: "POST"
        });

        const data = await response.json();

        document.getElementById("message").textContent = data.message;

        if (data.state) {
            await refreshStatus();
        }

    } catch (error) {
        document.getElementById("message").textContent =
            "Recovery failed. Check backend.";
    }
}

refreshStatus();
setInterval(refreshStatus, 5000);
