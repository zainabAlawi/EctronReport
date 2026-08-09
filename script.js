// Data configuration
const data = {
    weekly: {
        labels: ['12-Jul', '13-Jul', '14-Jul', '15-Jul', '16-Jul'],
        dailyProduction: [4200, 4300, 4100, 4500, 4250], // line
        achieved: 21350,
        target: 25600,
        departments: ['Assembly', 'Insulation', 'Calibration', 'Perso', 'Cards', 'Metrology'],
        deptProductionTarget: [4500, 4500, 4500, 4500, 4500, 4500],
        deptProductionAchieved: [4275, 4140, 4410, 3825, 3375, 2925],
        deptEfficiency: [95, 92, 98, 85, 75, 65] // bar
    },
    monthly: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        dailyProduction: [20500, 21350, 19800, 22100],
        achieved: 83750,
        target: 102400,
        departments: ['Assembly', 'Insulation', 'Calibration', 'Perso', 'Cards', 'Metrology'],
        deptProductionTarget: [18000, 18000, 18000, 18000, 18000, 18000],
        deptProductionAchieved: [17100, 16500, 17500, 15300, 14000, 12000],
        deptEfficiency: [95, 91.6, 97.2, 85, 77.7, 66.6]
    }
};

let currentDataset = data.weekly;
let charts = {};

// Colors
const colors = {
    green: '#4CAF50',
    darkGreen: '#2E7D32',
    lightGreenBg: 'rgba(76, 175, 80, 0.2)',
    yellow: '#f59e0b',
    red: '#ef4444',
    gray: '#e0e0e0'
};

// Conditional formatting function for Efficiency
function getEfficiencyColor(value) {
    if (value >= 90) return colors.green;
    if (value >= 70) return colors.yellow;
    return colors.red;
}

// Format numbers
const formatNumber = (num) => new Intl.NumberFormat().format(num);

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    updateKPIs();
    
    // Event listeners
    document.getElementById('period-select').addEventListener('change', (e) => {
        if (e.target.value === 'week-12-16') {
            currentDataset = data.weekly;
        } else {
            currentDataset = data.monthly;
        }
        updateDashboard();
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
        // Simulate data refresh with tiny random changes
        currentDataset.dailyProduction = currentDataset.dailyProduction.map(v => v + Math.floor(Math.random() * 200 - 100));
        currentDataset.deptEfficiency = currentDataset.deptEfficiency.map(v => Math.min(100, Math.max(0, v + Math.floor(Math.random() * 6 - 3))));
        updateDashboard();
    });
});

function updateKPIs() {
    document.getElementById('kpi-target').textContent = formatNumber(currentDataset.target);
    document.getElementById('kpi-achieved').textContent = formatNumber(currentDataset.achieved);
    
    const efficiency = (currentDataset.achieved / currentDataset.target) * 100;
    document.getElementById('kpi-efficiency').textContent = efficiency.toFixed(1) + '%';
    
    document.getElementById('doughnut-center-text').textContent = Math.round(efficiency) + '%';
    
    // Top / Lowest Dept
    const maxEff = Math.max(...currentDataset.deptEfficiency);
    const minEff = Math.min(...currentDataset.deptEfficiency);
    const maxIdx = currentDataset.deptEfficiency.indexOf(maxEff);
    const minIdx = currentDataset.deptEfficiency.indexOf(minEff);
    
    document.getElementById('top-dept-name').textContent = currentDataset.departments[maxIdx];
    document.querySelector('.top-dept .insight-metric').textContent = maxEff.toFixed(1) + '% Efficiency';
    
    document.getElementById('lowest-dept-name').textContent = currentDataset.departments[minIdx];
    document.querySelector('.lowest-dept .insight-metric').textContent = minEff.toFixed(1) + '% Efficiency';
}

function updateDashboard() {
    updateKPIs();
    
    // Update Line Chart
    charts.daily.data.labels = currentDataset.labels;
    charts.daily.data.datasets[0].data = currentDataset.dailyProduction;
    charts.daily.update();

    // Update Doughnut
    charts.achievement.data.datasets[0].data = [currentDataset.achieved, currentDataset.target - currentDataset.achieved];
    charts.achievement.update();

    // Update Column Chart
    charts.comparison.data.labels = currentDataset.departments;
    charts.comparison.data.datasets[0].data = currentDataset.deptProductionTarget;
    charts.comparison.data.datasets[1].data = currentDataset.deptProductionAchieved;
    charts.comparison.update();

    // Update Bar Chart
    charts.efficiency.data.labels = currentDataset.departments;
    charts.efficiency.data.datasets[0].data = currentDataset.deptEfficiency;
    charts.efficiency.data.datasets[0].backgroundColor = currentDataset.deptEfficiency.map(getEfficiencyColor);
    charts.efficiency.update();
}

function initCharts() {
    // Global Chart Defaults
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#666';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;

    // 1. Daily Production Line Chart
    const ctxDaily = document.getElementById('dailyProductionChart').getContext('2d');
    charts.daily = new Chart(ctxDaily, {
        type: 'line',
        data: {
            labels: currentDataset.labels,
            datasets: [{
                label: 'Production Count',
                data: currentDataset.dailyProduction,
                borderColor: colors.darkGreen,
                backgroundColor: colors.lightGreenBg,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: colors.darkGreen,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Achievement % Doughnut Chart
    const ctxAchievement = document.getElementById('achievementChart').getContext('2d');
    charts.achievement = new Chart(ctxAchievement, {
        type: 'doughnut',
        data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
                data: [currentDataset.achieved, currentDataset.target - currentDataset.achieved],
                backgroundColor: [colors.green, colors.gray],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 3. Department Production Comparison (Clustered Column)
    const ctxComparison = document.getElementById('deptComparisonChart').getContext('2d');
    charts.comparison = new Chart(ctxComparison, {
        type: 'bar',
        data: {
            labels: currentDataset.departments,
            datasets: [
                {
                    label: 'Target',
                    data: currentDataset.deptProductionTarget,
                    backgroundColor: colors.gray,
                    borderRadius: 4
                },
                {
                    label: 'Achieved',
                    data: currentDataset.deptProductionAchieved,
                    backgroundColor: colors.darkGreen,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end' }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false } }
            }
        }
    });

    // 4. Department Efficiency (Bar Chart with Conditional Formatting)
    const ctxEfficiency = document.getElementById('deptEfficiencyChart').getContext('2d');
    charts.efficiency = new Chart(ctxEfficiency, {
        type: 'bar',
        data: {
            labels: currentDataset.departments,
            datasets: [{
                label: 'Efficiency %',
                data: currentDataset.deptEfficiency,
                backgroundColor: currentDataset.deptEfficiency.map(getEfficiencyColor),
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw + '%';
                        }
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, max: 100, grid: { borderDash: [4, 4] } },
                y: { grid: { display: false } }
            }
        }
    });
}
