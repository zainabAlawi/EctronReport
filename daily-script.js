document.addEventListener('DOMContentLoaded', () => {
    // Shared Chart options for professional look
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#666';
    Chart.defaults.scale.grid.color = '#f0f0f0';
    
    // 1. Daily Production by Department (Bar Chart)
    const ctxDept = document.getElementById('dailyDeptChart').getContext('2d');
    
    // Data from Monday 20-Jul-26
    const departments = ['Assembly', 'Insolation', 'Radiation Freq', 'Calibration', 'Multy test', 'Metrology', 'Perso', 'Cards'];
    const targets = [640, 640, 640, 640, 640, 640, 640, 640];
    const achieved = [753, 750, 733, 713, 639, 100, 364, 753];
    
    new Chart(ctxDept, {
        type: 'bar',
        data: {
            labels: departments,
            datasets: [
                {
                    label: 'Target',
                    data: targets,
                    backgroundColor: '#e2e8f0', // Light gray
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Achieved',
                    data: achieved,
                    backgroundColor: '#2E7D32', // Primary green
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4,
                    usePointStyle: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // 2. Overall Achievement (Doughnut Chart)
    const ctxAchievement = document.getElementById('dailyAchievementChart').getContext('2d');
    
    // Calculations for overall
    const totalTarget = 5120;
    const totalAchieved = 4805;
    const remaining = totalTarget - totalAchieved > 0 ? totalTarget - totalAchieved : 0;
    // Note: Since achievement is 4805/5120 = 93.8%
    
    new Chart(ctxAchievement, {
        type: 'doughnut',
        data: {
            labels: ['Achieved', 'Remaining Target'],
            datasets: [{
                data: [totalAchieved, remaining],
                backgroundColor: [
                    '#4CAF50', // Light Green for achieved
                    '#f1f5f9'  // Very light grey for remaining
                ],
                borderWidth: 0,
                cutout: '75%',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
});
