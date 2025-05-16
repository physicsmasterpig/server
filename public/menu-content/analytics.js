// Analytics Dashboard JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load Chart.js dynamically with a more reliable approach
    loadChartJS()
        .then(() => {
            console.log('Chart.js loaded successfully');
            initializeAnalytics();
        })
        .catch(err => {
            console.error('Failed to load Chart.js:', err);
            displayErrorMessage('Failed to load chart library. Please refresh the page.');
            // Still try to initialize the UI elements even if Chart.js fails
            initializeUIElements();
        });

    // Set up tab navigation
    setupTabNavigation();
});

/**
 * Load Chart.js dynamically
 */
function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            console.log('Chart.js already loaded');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.integrity = 'sha384-Ba1XOIuZEUoXCXcJ+VS3J0tmGI79uVHJcnLVeI/Kxze9fHMxXx4+l6ZFTxpLnFkq';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
        
        // Add a timeout to reject if loading takes too long
        setTimeout(() => {
            if (!window.Chart) {
                reject(new Error('Chart.js load timeout'));
            }
        }, 10000);
    });
}

/**
 * Initialize analytics dashboard
 */
function initializeAnalytics() {
    console.log('Initializing analytics dashboard');
    
    // Create error container for potential error messages
    createErrorContainer();
    
    // Initialize UI elements
    initializeUIElements();
    
    // First initialize empty charts to ensure containers are ready
    initEmptyCharts();
    
    // Load data (first try API, fallback to sample data)
    fetchAnalyticsData()
        .then(data => {
            console.log('Analytics data loaded:', data);
            updateDashboardWithData(data);
        })
        .catch(err => {
            console.error('Failed to fetch analytics data, using sample data instead:', err);
            loadSampleData();
        });
}

/**
 * Initialize empty chart containers
 */
function initEmptyCharts() {
    console.log('Initializing empty chart containers');
    if (!window.Chart) {
        console.error('Chart.js not available for empty chart initialization');
        return;
    }
    
    // Clear any existing charts to prevent duplicates
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
}

/**
 * Setup event listeners and UI elements
 */
function initializeUIElements() {
    // Set up filter controls
    document.getElementById('analysis-scope').addEventListener('change', updateScopeFilters);
    document.getElementById('time-period').addEventListener('change', updateDateFilters);
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    
    // Set up comparison controls
    document.getElementById('comparison-type').addEventListener('change', updateComparisonItems);
    document.getElementById('comparison-metric').addEventListener('change', updateMetricOptions);
    document.getElementById('run-comparison').addEventListener('click', runComparison);
    
    // Initialize scope filters
    updateScopeFilters();
}

/**
 * Setup tab navigation functionality
 */
function setupTabNavigation() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabItems.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

/**
 * Update scope filter options based on selection
 */
function updateScopeFilters() {
    const scope = document.getElementById('analysis-scope').value;
    const container = document.getElementById('scope-filter-container');
    
    let filterHTML = '';
    
    switch(scope) {
        case 'by-class':
            filterHTML = `
                <label class="filter-label">Select Class</label>
                <select class="filter-select" id="class-filter">
                    <option value="all">All Classes</option>
                    <option value="math-101">Mathematics 101</option>
                    <option value="science-202">Science 202</option>
                    <option value="english-101">English 101</option>
                    <option value="history-101">History 101</option>
                    <option value="cs-202">Computer Science 202</option>
                </select>
                <div class="filter-label" style="margin-top: 10px;">Lecture Sequence View</div>
                <div class="toggle-container">
                    <input type="checkbox" id="lecture-sequence-toggle" class="toggle-input">
                    <label for="lecture-sequence-toggle" class="toggle-label"></label>
                    <span class="toggle-text">Show lecture progression</span>
                </div>
            `;
            break;
            
        case 'by-student':
            filterHTML = `
                <label class="filter-label">Select Student</label>
                <select class="filter-select" id="student-filter">
                    <option value="all">All Students</option>
                    <option value="student-1">Kim Min-ji</option>
                    <option value="student-2">Park Ji-hun</option>
                    <option value="student-3">Lee Seo-yeon</option>
                    <option value="student-4">Han So-mi</option>
                    <option value="student-5">Kang Tae-woo</option>
                </select>
                <div class="filter-label" style="margin-top: 10px;">Semester Selection</div>
                <div class="multi-select-container" style="max-height: 120px">
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2025-1" checked>
                        <label for="sem-2025-1">2025 Spring</label>
                    </div>
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2024-2">
                        <label for="sem-2024-2">2024 Fall</label>
                    </div>
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2024-1">
                        <label for="sem-2024-1">2024 Spring</label>
                    </div>
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2023-2">
                        <label for="sem-2023-2">2023 Fall</label>
                    </div>
                </div>
            `;
            break;
            
        case 'by-school':
            filterHTML = `
                <label class="filter-label">Select School</label>
                <select class="filter-select" id="school-filter">
                    <option value="all">All Schools</option>
                    <option value="school-1">Seoul International</option>
                    <option value="school-2">Busan Academy</option>
                    <option value="school-3">Daegu High School</option>
                </select>
                <div class="filter-label" style="margin-top: 10px;">Generation</div>
                <select class="filter-select" id="generation-filter">
                    <option value="all">All Generations</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                </select>
            `;
            break;
            
        default:
            filterHTML = '<p class="filter-label">No additional filters needed</p>';
    }
    
    container.innerHTML = filterHTML;
    
    // Set up any additional event listeners for new elements
    if (scope === 'by-class') {
        const lectureToggle = document.getElementById('lecture-sequence-toggle');
        if (lectureToggle) {
            lectureToggle.addEventListener('change', function() {
                if (this.checked) {
                    // Show lecture sequence specific charts
                    showLectureSequenceView();
                } else {
                    // Show regular class view
                    showRegularClassView();
                }
            });
        }
    }
}

/**
 * Show lecture sequence specific charts
 */
function showLectureSequenceView() {
    // Add a custom section for lecture sequence if not exists
    if (!document.getElementById('lecture-sequence-view')) {
        const parentTab = document.getElementById('attendance-tab');
        
        if (parentTab) {
            // Create a new section for lecture sequence charts
            const lectureSequenceView = document.createElement('div');
            lectureSequenceView.id = 'lecture-sequence-view';
            lectureSequenceView.className = 'chart-row';
            lectureSequenceView.innerHTML = `
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title">Attendance by Lecture</div>
                    </div>
                    <div class="chart-body">
                        <canvas id="lecture-attendance-chart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title">Performance by Lecture</div>
                    </div>
                    <div class="chart-body">
                        <canvas id="lecture-performance-chart"></canvas>
                    </div>
                </div>
            `;
            
            // Insert before the first chart row
            const firstChartRow = parentTab.querySelector('.chart-row');
            if (firstChartRow) {
                parentTab.insertBefore(lectureSequenceView, firstChartRow);
            } else {
                parentTab.appendChild(lectureSequenceView);
            }
            
            // Initialize the lecture sequence charts
            initLectureSequenceCharts();
        }
    } else {
        document.getElementById('lecture-sequence-view').style.display = 'grid';
    }
}

/**
 * Hide lecture sequence specific charts
 */
function showRegularClassView() {
    const lectureSequenceView = document.getElementById('lecture-sequence-view');
    if (lectureSequenceView) {
        lectureSequenceView.style.display = 'none';
    }
}

/**
 * Initialize charts for lecture sequence view
 */
function initLectureSequenceCharts() {
    // Lecture attendance chart
    const lectureAttendanceCtx = document.getElementById('lecture-attendance-chart');
    if (lectureAttendanceCtx) {
        new Chart(lectureAttendanceCtx, {
            type: 'line',
            data: {
                labels: ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lecture 5', 'Lecture 6', 'Lecture 7', 'Lecture 8'],
                datasets: [{
                    label: 'Attendance Rate',
                    data: [95, 90, 85, 88, 92, 86, 89, 91],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Attendance: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 50,
                        max: 100,
                        ticks: { 
                            color: '#a3aed0',
                            callback: value => value + '%'
                        },
                        grid: { color: 'rgba(163, 174, 208, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a3aed0' },
                        grid: { color: 'rgba(163, 174, 208, 0.1)' }
                    }
                }
            }
        });
    }
    
    // Lecture performance chart
    const lecturePerformanceCtx = document.getElementById('lecture-performance-chart');
    if (lecturePerformanceCtx) {
        new Chart(lecturePerformanceCtx, {
            type: 'bar',
            data: {
                labels: ['Quiz 1', 'Quiz 2', 'Midterm', 'Quiz 3', 'Quiz 4', 'Final'],
                datasets: [{
                    label: 'Average Score',
                    data: [78, 82, 76, 85, 88, 80],
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Average: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 50,
                        max: 100,
                        ticks: { 
                            color: '#a3aed0',
                            callback: value => value + '%'
                        },
                        grid: { color: 'rgba(163, 174, 208, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a3aed0' },
                        grid: { color: 'rgba(163, 174, 208, 0.1)' }
                    }
                }
            }
        });
    }
}

/**
 * Update date filter options based on time period selection
 */
function updateDateFilters() {
    const timePeriod = document.getElementById('time-period').value;
    const datePicker = document.getElementById('custom-date-container') || document.createElement('div');
    
    if (timePeriod === 'custom') {
        datePicker.id = 'custom-date-container';
        datePicker.className = 'filter-group';
        datePicker.innerHTML = `
            <label class="filter-label">Date Range</label>
            <div style="display: flex; gap: 10px;">
                <input type="date" id="start-date" class="filter-select">
                <input type="date" id="end-date" class="filter-select">
            </div>
        `;
        
        const timeFilter = document.getElementById('time-period');
        timeFilter.parentNode.after(datePicker);
    } else {
        if (document.getElementById('custom-date-container')) {
            document.getElementById('custom-date-container').remove();
        }
    }
}

/**
 * Apply the selected filters
 */
function applyFilters() {
    console.log('Applying filters...');
    
    // Show loading state
    showLoadingState();
    
    const applyButton = document.getElementById('apply-filters');
    const originalText = applyButton.textContent;
    applyButton.textContent = 'Applying...';
    applyButton.disabled = true;
    
    // Collect filter data
    const filters = {
        scope: document.getElementById('analysis-scope').value,
        timePeriod: document.getElementById('time-period').value
    };
    
    // Add scope-specific filter
    if (filters.scope === 'by-class' && document.getElementById('class-filter')) {
        filters.classId = document.getElementById('class-filter').value;
    } else if (filters.scope === 'by-student' && document.getElementById('student-filter')) {
        filters.studentId = document.getElementById('student-filter').value;
    } else if (filters.scope === 'by-school' && document.getElementById('school-filter')) {
        filters.schoolId = document.getElementById('school-filter').value;
    } else if (filters.scope === 'by-generation' && document.getElementById('generation-filter')) {
        filters.generation = document.getElementById('generation-filter').value;
    }
    
    // Add date range if custom time period
    if (filters.timePeriod === 'custom') {
        filters.startDate = document.getElementById('start-date')?.value;
        filters.endDate = document.getElementById('end-date')?.value;
    }
    
    // Fetch filtered data - with more randomness to show visible changes
    fetchFilteredData(filters)
        .then(data => {
            console.log('Filtered data received:', data);
            updateDashboardWithData(data);
        })
        .catch(err => {
            console.error('Error fetching filtered data:', err);
            displayErrorMessage('Unable to apply filters. Please try again.');
        })
        .finally(() => {
            // Reset button
            applyButton.textContent = originalText;
            applyButton.disabled = false;
            hideLoadingState();
        });
}

/**
 * Fetch filtered analytics data from the server
 */
function fetchFilteredData(filters) {
    console.log('Fetching filtered data with:', filters);
    // For demo purposes, return sample data after a delay with more randomness
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalStudents: 28 + Math.floor(Math.random() * 15),  // More random variation
                activeStudents: 24 + Math.floor(Math.random() * 6),
                newEnrollments: 3 + Math.floor(Math.random() * 4),
                attendanceRate: 65 + Math.floor(Math.random() * 25),  // Wider range
                attendanceCompare: Math.floor(Math.random() * 12) - 5,  // Allow negative values
                avgExamScore: 70 + Math.floor(Math.random() * 25),
                scoreCompare: Math.floor(Math.random() * 10) - 3,  // Allow negative values
                homeworkCompletion: 75 + Math.floor(Math.random() * 20),
                homeworkCompare: Math.floor(Math.random() * 8) - 2,  // Allow negative values
                // Add data for charts
                chartData: {
                    attendancePatterns: generateRandomAttendanceData(),
                    gradeDistribution: generateRandomGradeData(),
                    subjectPerformance: generateRandomSubjectData()
                }
            });
        }, 1000);
    });
}

/**
 * Generate random attendance data for charts
 */
function generateRandomAttendanceData() {
    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [
            60 + Math.floor(Math.random() * 30),
            60 + Math.floor(Math.random() * 30),
            60 + Math.floor(Math.random() * 30),
            60 + Math.floor(Math.random() * 30),
            60 + Math.floor(Math.random() * 30),
            60 + Math.floor(Math.random() * 30)
        ]
    };
}

/**
 * Generate random grade distribution data
 */
function generateRandomGradeData() {
    return {
        labels: ['A', 'B', 'C', 'D', 'F'],
        values: [
            Math.floor(Math.random() * 15) + 5,
            Math.floor(Math.random() * 12) + 5,
            Math.floor(Math.random() * 8) + 3,
            Math.floor(Math.random() * 5) + 1,
            Math.floor(Math.random() * 3)
        ]
    };
}

/**
 * Generate random subject performance data
 */
function generateRandomSubjectData() {
    return {
        labels: ['Math', 'Science', 'English', 'History', 'Arts'],
        values: [
            70 + Math.floor(Math.random() * 25),
            70 + Math.floor(Math.random() * 25),
            70 + Math.floor(Math.random() * 25),
            70 + Math.floor(Math.random() * 25),
            70 + Math.floor(Math.random() * 25)
        ]
    };
}

/**
 * Fetch analytics data from the server
 */
function fetchAnalyticsData() {
    // In a real implementation, this would call the API
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalStudents: 28,
                activeStudents: 24,
                newEnrollments: 3,
                attendanceRate: 78,
                attendanceCompare: 5,
                avgExamScore: 82,
                scoreCompare: 3,
                homeworkCompletion: 91,
                homeworkCompare: 1
            });
        }, 500);
    });
}

/**
 * Update dashboard with the provided data
 */
function updateDashboardWithData(data) {
    console.log('Updating dashboard with data:', data);
    
    // Update stats cards
    updateSummaryStats(data);
    
    // Update charts with new data
    if (data.chartData) {
        updateChartsWithData(data.chartData);
    } else {
        // If no chart data provided, reinitialize with random data
        initAllCharts();
    }
    
    // Add a visual indication that data has been updated
    flashUpdateNotification();
}

/**
 * Flash a notification that data has been updated
 */
function flashUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.textContent = 'Data updated';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: fadeIn 0.3s, fadeOut 0.3s 2s forwards;
    `;
    
    // Add styles if not already present
    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 2.5 seconds
    setTimeout(() => {
        notification.remove();
    }, 2500);
}

/**
 * Update charts with provided data
 */
function updateChartsWithData(chartData) {
    console.log('Updating charts with data:', chartData);
    
    // Make sure Chart.js is loaded
    if (!window.Chart) {
        console.error('Chart.js not loaded, cannot update charts');
        displayErrorMessage('Failed to update charts. Please refresh the page.');
        return;
    }
    
    // Update attendance patterns chart
    if (chartData.attendancePatterns) {
        updateAttendancePatternChart(chartData.attendancePatterns);
    }
    
    // Update grade distribution chart
    if (chartData.gradeDistribution) {
        updateGradeDistributionChart(chartData.gradeDistribution);
    }
    
    // Update subject performance chart
    if (chartData.subjectPerformance) {
        updateSubjectPerformanceChart(chartData.subjectPerformance);
    }
    
    // Initialize other charts that might not have specific data
    initRemainingCharts();
}

/**
 * Update the attendance pattern chart with new data
 */
function updateAttendancePatternChart(data) {
    const attendancePatternCtx = document.getElementById('attendance-pattern-chart');
    if (!attendancePatternCtx) {
        console.error('Attendance pattern chart canvas not found');
        return;
    }
    
    // Check if chart already exists and destroy it
    let chartInstance = Chart.getChart(attendancePatternCtx);
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart with updated data
    new Chart(attendancePatternCtx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Attendance Rate',
                data: data.values,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#a3aed0'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 50,
                    max: 100,
                    ticks: {
                        color: '#a3aed0'
                    },
                    grid: {
                        color: 'rgba(163, 174, 208, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#a3aed0'
                    },
                    grid: {
                        color: 'rgba(163, 174, 208, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Update the grade distribution chart with new data
 */
function updateGradeDistributionChart(data) {
    const gradeDistCtx = document.getElementById('grade-distribution-chart');
    if (!gradeDistCtx) {
        console.error('Grade distribution chart canvas not found');
        return;
    }
    
    // Check if chart already exists and destroy it
    let chartInstance = Chart.getChart(gradeDistCtx);
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart with updated data
    new Chart(gradeDistCtx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Number of Students',
                data: data.values,
                backgroundColor: 'rgba(114, 95, 255, 0.7)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#a3aed0'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#a3aed0'
                    },
                    grid: {
                        color: 'rgba(163, 174, 208, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#a3aed0'
                    },
                    grid: {
                        color: 'rgba(163, 174, 208, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Update the subject performance chart with new data
 */
function updateSubjectPerformanceChart(data) {
    const subjectPerfCtx = document.getElementById('subject-performance-chart');
    if (!subjectPerfCtx) {
        console.error('Subject performance chart canvas not found');
        return;
    }
    
    // Check if chart already exists and destroy it
    let chartInstance = Chart.getChart(subjectPerfCtx);
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart with updated data
    new Chart(subjectPerfCtx, {
        type: 'radar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Class Average',
                data: data.values,
                borderColor: 'rgba(114, 95, 255, 1)',
                backgroundColor: 'rgba(114, 95, 255, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(114, 95, 255, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(163, 174, 208, 0.1)'
                    },
                    grid: {
                        color: 'rgba(163, 174, 208, 0.1)'
                    },
                    pointLabels: {
                        color: '#a3aed0'
                    },
                    ticks: {
                        backdropColor: 'transparent',
                        color: '#a3aed0'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#a3aed0'
                    }
                }
            }
        }
    });
}

/**
 * Initialize remaining charts that don't have specific data updates
 */
function initRemainingCharts() {
    // Performance vs Attendance Chart (scatter plot)
    const perfAttendCtx = document.getElementById('performance-attendance-chart');
    if (perfAttendCtx) {
        let chartInstance = Chart.getChart(perfAttendCtx);
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Generate random scatter data
        const scatterData = [];
        for (let i = 0; i < 15; i++) {
            scatterData.push({
                x: 60 + Math.floor(Math.random() * 40), // attendance 60-100%
                y: 60 + Math.floor(Math.random() * 40)  // score 60-100%
            });
        }
        
        new Chart(perfAttendCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Students',
                    data: scatterData,
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Attendance: ${context.parsed.x}%, Score: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Average Score (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Attendance Rate (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Update attendance distribution chart (pie chart)
    const attendanceDistCtx = document.getElementById('attendance-distribution-chart');
    if (attendanceDistCtx) {
        let chartInstance = Chart.getChart(attendanceDistCtx);
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Generate random distribution data
        const total = 28;
        const a = Math.floor(Math.random() * 12) + 6; // 6-18
        const b = Math.floor(Math.random() * 10) + 4; // 4-14
        const c = Math.floor(Math.random() * 8) + 2;  // 2-10
        const d = Math.max(1, total - a - b - c);     // at least 1
        
        new Chart(attendanceDistCtx, {
            type: 'pie',
            data: {
                labels: ['90%+', '80-90%', '70-80%', 'Below 70%'],
                datasets: [{
                    data: [a, b, c, d],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(255, 152, 0, 1)',
                        'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update comparison items based on the selected comparison type
 */
function updateComparisonItems() {
    const comparisonType = document.getElementById('comparison-type').value;
    const itemsContainer = document.getElementById('comparison-items');
    
    let itemsHTML = '';
    
    switch(comparisonType) {
        case 'classes':
            itemsHTML = `
                <div class="multi-select-item"><input type="checkbox" id="class1" checked><label for="class1">Mathematics 101</label></div>
                <div class="multi-select-item"><input type="checkbox" id="class2" checked><label for="class2">Science 202</label></div>
                <div class="multi-select-item"><input type="checkbox" id="class3"><label for="class3">English 101</label></div>
                <div class="multi-select-item"><input type="checkbox" id="class4"><label for="class4">History 101</label></div>
                <div class="multi-select-item"><input type="checkbox" id="class5"><label for="class5">Computer Science 202</label></div>
            `;
            break;
            
        case 'students':
            itemsHTML = `
                <div class="multi-select-item"><input type="checkbox" id="student1" checked><label for="student1">Kim Min-ji</label></div>
                <div class="multi-select-item"><input type="checkbox" id="student2" checked><label for="student2">Park Ji-hun</label></div>
                <div class="multi-select-item"><input type="checkbox" id="student3"><label for="student3">Lee Seo-yeon</label></div>
                <div class="multi-select-item"><input type="checkbox" id="student4"><label for="student4">Han So-mi</label></div>
                <div class="multi-select-item"><input type="checkbox" id="student5"><label for="student5">Kang Tae-woo</label></div>
            `;
            break;
            
        case 'schools':
            itemsHTML = `
                <div class="multi-select-item"><input type="checkbox" id="school1" checked><label for="school1">Seoul International</label></div>
                <div class="multi-select-item"><input type="checkbox" id="school2" checked><label for="school2">Busan Academy</label></div>
                <div class="multi-select-item"><input type="checkbox" id="school3"><label for="school3">Daegu High School</label></div>
            `;
            break;
            
        case 'generations':
            itemsHTML = `
                <div class="multi-select-item"><input type="checkbox" id="gen1" checked><label for="gen1">2023</label></div>
                <div class="multi-select-item"><input type="checkbox" id="gen2" checked><label for="gen2">2022</label></div>
                <div class="multi-select-item"><input type="checkbox" id="gen3"><label for="gen3">2021</label></div>
                <div class="multi-select-item"><input type="checkbox" id="gen4"><label for="gen4">2020</label></div>
            `;
            break;
    }
    
    itemsContainer.innerHTML = itemsHTML;
}

/**
 * Update metric options based on the selected comparison metric
 */
function updateMetricOptions() {
    // In a real implementation, this would update additional options
    // based on the selected metric
    console.log('Metric updated to:', document.getElementById('comparison-metric').value);
}

/**
 * Run the comparison based on selected options
 */
function runComparison() {
    console.log('Running comparison...');
    
    // Show loading state
    const compareButton = document.getElementById('run-comparison');
    const originalText = compareButton.textContent;
    compareButton.textContent = 'Running...';
    compareButton.disabled = true;
    
    // In a real implementation, this would call the API with the selected options
    setTimeout(() => {
        // Reinitialize comparison charts with "new" data
        const comparisonChartInstance = Chart.getChart('comparison-chart');
        if (comparisonChartInstance) {
            comparisonChartInstance.destroy();
        }
        
        const correlationChartInstance = Chart.getChart('correlation-chart');
        if (correlationChartInstance) {
            correlationChartInstance.destroy();
        }
        
        // Initialize with "new" data (random variations)
        initComparisonCharts();
        
        // Update stats table with random data
        updateComparisonTable();
        
        // Reset button
        compareButton.textContent = originalText;
        compareButton.disabled = false;
    }, 1500);
}

/**
 * Update the comparison stats table with random data
 */
function updateComparisonTable() {
    const statsTable = document.getElementById('stats-table');
    
    // Generate random variations
    const data = [
        {
            name: 'Mathematics 101',
            avg: (85 + Math.random() * 3).toFixed(1),
            median: (86 + Math.random() * 3).toFixed(1),
            stdDev: (7.4 + Math.random()).toFixed(1),
            min: (68 + Math.random() * 2).toFixed(1),
            max: (98 + Math.random()).toFixed(1)
        },
        {
            name: 'Science 202',
            avg: (81 + Math.random() * 3).toFixed(1),
            median: (83 + Math.random() * 3).toFixed(1),
            stdDev: (8.2 + Math.random()).toFixed(1),
            min: (62 + Math.random() * 2).toFixed(1),
            max: (97 + Math.random()).toFixed(1)
        }
    ];
    
    // Update the table
    statsTable.innerHTML = data.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.avg}%</td>
            <td>${item.median}%</td>
            <td>${item.stdDev}</td>
            <td>${item.min}%</td>
            <td>${item.max}%</td>
        </tr>
    `).join('');
}

/**
 * Create error message container
 */
function createErrorContainer() {
    if (!document.getElementById('analytics-error')) {
        const container = document.querySelector('.analytics-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'analytics-error';
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background-color: rgba(244, 67, 54, 0.1);
                border-left: 4px solid #f44336;
                color: #f44336;
                padding: 10px 15px;
                margin-bottom: 20px;
                border-radius: 4px;
                display: none;
            `;
            
            // Insert at the top of the container
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
}

/**
 * Load analytics data from the server
 */
function loadAnalyticsData(filters = null) {
    // Show loading state
    showLoadingState();
    
    // Default filters if none provided
    const defaultFilters = {
        scope: 'all',
        timePeriod: 'current-semester'
    };
    
    // Use provided filters or defaults
    const appliedFilters = filters || defaultFilters;
    
    // Convert filters to query string
    const queryParams = new URLSearchParams();
    Object.keys(appliedFilters).forEach(key => {
        if (appliedFilters[key] !== null && appliedFilters[key] !== undefined) {
            queryParams.append(key, appliedFilters[key]);
        }
    });
    
    // Using a timeout to simulate network request for demo purposes
    // This will ensure the loading animation shows correctly
    setTimeout(() => {
        try {
            // In a real app, these would be fetch calls to the server
            // For now, use sample data directly
            console.log('Loading analytics with filters:', appliedFilters);
            
            // Load sample data
            loadSampleData();
            
            // Initialize charts with the data
            initCharts();
            
            hideLoadingState();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            displayErrorMessage('Failed to load analytics data. Please try again later.');
            
            // If error occurs, still load sample data so the dashboard isn't empty
            loadSampleData();
            initCharts();
            hideLoadingState();
        }
    }, 800);  // Simulate network delay
}

/**
 * Set up tab switching functionality
 */
function setupTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabItems.forEach(item => item.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Get the tab to activate
            const tabToActivate = this.getAttribute('data-tab');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the selected tab content
            document.getElementById(tabToActivate + '-tab').classList.add('active');
        });
    });
}

/**
 * Set up filter controls
 */
function setupFilterControls() {
    const analysisScope = document.getElementById('analysis-scope');
    const scopeFilterContainer = document.getElementById('scope-filter-container');
    const timePeriod = document.getElementById('time-period');
    const applyFilters = document.getElementById('apply-filters');

    // Handle analysis scope change
    if (analysisScope) {
        analysisScope.addEventListener('change', function() {
            // Clear current filters
            scopeFilterContainer.innerHTML = '';
            
            // Add appropriate filter based on scope
            switch (this.value) {
                case 'by-class':
                    populateClassFilter(scopeFilterContainer);
                    break;
                case 'by-student':
                    populateStudentFilter(scopeFilterContainer);
                    break;
                case 'by-school':
                    populateSchoolFilter(scopeFilterContainer);
                    break;
                case 'by-generation':
                    populateGenerationFilter(scopeFilterContainer);
                    break;
                default:
                    // 'all' - no additional filters needed
                    break;
            }
        });
    }

    // Handle time period change
    if (timePeriod) {
        timePeriod.addEventListener('change', function() {
            if (this.value === 'custom') {
                // Add date range picker for custom period
                addCustomDatePicker();
            } else {
                // Remove custom date picker if it exists
                const customDatePicker = document.getElementById('custom-date-picker');
                if (customDatePicker) {
                    customDatePicker.remove();
                }
            }
        });
    }

    // Handle filter application
    if (applyFilters) {
        applyFilters.addEventListener('click', function() {
            // Get all filter values
            const filters = getAppliedFilters();
            
            // Update dashboards based on filters
            updateAnalyticsByFilters(filters);
        });
    }
}

/**
 * Add custom date picker to filter controls
 */
function addCustomDatePicker() {
    const dateFilter = document.querySelector('.date-filter');
    
    // Create custom date picker if it doesn't exist
    if (!document.getElementById('custom-date-picker')) {
        const customDatePicker = document.createElement('div');
        customDatePicker.id = 'custom-date-picker';
        customDatePicker.style.marginTop = '10px';
        customDatePicker.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="date" id="date-from" class="filter-select" style="width: 150px;">
                <span style="color: var(--secondary-text-color, #a3aed0);">to</span>
                <input type="date" id="date-to" class="filter-select" style="width: 150px;">
            </div>
        `;
        
        dateFilter.appendChild(customDatePicker);
        
        // Set default dates (last month)
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        document.getElementById('date-to').valueAsDate = today;
        document.getElementById('date-from').valueAsDate = lastMonth;
    }
}

/**
 * Get all currently applied filters
 */
function getAppliedFilters() {
    const filters = {
        scope: document.getElementById('analysis-scope').value,
        timePeriod: document.getElementById('time-period').value,
    };
    
    // Add scope-specific filters
    switch (filters.scope) {
        case 'by-class':
            const classSelect = document.getElementById('class-filter');
            if (classSelect) filters.classId = classSelect.value;
            break;
        case 'by-student':
            const studentSelect = document.getElementById('student-filter');
            if (studentSelect) filters.studentId = studentSelect.value;
            break;
        case 'by-school':
            const schoolSelect = document.getElementById('school-filter');
            if (schoolSelect) filters.schoolId = schoolSelect.value;
            break;
        case 'by-generation':
            const genSelect = document.getElementById('generation-filter');
            if (genSelect) filters.generationId = genSelect.value;
            break;
    }
    
    // Add custom date range if applicable
    if (filters.timePeriod === 'custom') {
        filters.dateFrom = document.getElementById('date-from').value;
        filters.dateTo = document.getElementById('date-to').value;
    }
    
    return filters;
}

/**
 * Update analytics dashboard based on applied filters
 */
function updateAnalyticsByFilters(filters) {
    // Show loading indicator
    showLoadingState();
    
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
            queryParams.append(key, filters[key]);
        }
    });
    
    // Fetch summary data
    fetch(`/analytics/summary?${queryParams.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update summary statistics
                updateSummaryStats(data.summary);
                
                // Now fetch attendance data
                return fetch(`/analytics/attendance?${queryParams.toString()}`);
            } else {
                throw new Error(data.error || 'Failed to load summary data');
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update attendance data
                updateAttendanceData(data.attendanceAnalytics);
                
                // Now fetch performance data
                return fetch(`/analytics/performance?${queryParams.toString()}`);
            } else {
                throw new Error(data.error || 'Failed to load attendance data');
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update performance data
                updatePerformanceData(data.performanceAnalytics);
            } else {
                throw new Error(data.error || 'Failed to load performance data');
            }
        })
        .catch(error => {
            console.error('Error updating analytics:', error);
            displayErrorMessage('Failed to load analytics data. Please try again later.');
        })
        .finally(() => {
            // Hide loading indicator
            hideLoadingState();
        });
}

/**
 * Show loading state while fetching data
 */
function showLoadingState() {
    const chartBodies = document.querySelectorAll('.chart-body');
    
    chartBodies.forEach(body => {
        // Add semi-transparent overlay with spinner
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(24, 30, 41, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
        `;
        
        // Add a spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid rgba(114, 95, 255, 0.1);
            border-left-color: var(--accent-color, #725fff);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        overlay.appendChild(spinner);
        
        // Add keyframe animation for spinner
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Only add if not already present
        if (!body.querySelector('.loading-overlay')) {
            body.style.position = 'relative';
            body.appendChild(overlay);
        }
    });
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const overlays = document.querySelectorAll('.loading-overlay');
    overlays.forEach(overlay => overlay.remove());
}

/**
 * Populate class filter dropdown
 */
function populateClassFilter(container) {
    container.innerHTML = `
        <select id="class-filter" class="filter-select">
            <option value="all">All Classes</option>
            <option value="1000">Mathematics 101</option>
            <option value="1001">Science 202</option>
            <option value="1002">English 101</option>
            <option value="1003">History 101</option>
            <option value="1004">Computer Science 202</option>
        </select>
    `;
}

/**
 * Populate student filter dropdown
 */
function populateStudentFilter(container) {
    container.innerHTML = `
        <select id="student-filter" class="filter-select">
            <option value="all">All Students</option>
            <option value="1000000">Kim Min-ji</option>
            <option value="1000001">Park Ji-hun</option>
            <option value="1000002">Lee Seo-yeon</option>
            <option value="1000003">Choi Joon-ho</option>
            <option value="1000004">Han So-mi</option>
        </select>
    `;
}

/**
 * Populate school filter dropdown
 */
function populateSchoolFilter(container) {
    container.innerHTML = `
        <select id="school-filter" class="filter-select">
            <option value="all">All Schools</option>
            <option value="1">Seoul Central High School</option>
            <option value="2">Busan Science Academy</option>
            <option value="3">Incheon International School</option>
        </select>
    `;
}

/**
 * Populate generation filter dropdown
 */
function populateGenerationFilter(container) {
    container.innerHTML = `
        <select id="generation-filter" class="filter-select">
            <option value="all">All Generations</option>
            <option value="2025">Class of 2025</option>
            <option value="2024">Class of 2024</option>
            <option value="2023">Class of 2023</option>
        </select>
    `;
}

/**
 * Set up comparison controls
 */
function setupComparisonControls() {
    const comparisonType = document.getElementById('comparison-type');
    const comparisonItems = document.getElementById('comparison-items');
    const comparisonMetric = document.getElementById('comparison-metric');
    const runComparison = document.getElementById('run-comparison');
    
    if (comparisonType) {
        comparisonType.addEventListener('change', function() {
            // Update the comparison items based on comparison type
            updateComparisonItems(this.value);
        });
    }
    
    if (runComparison) {
        runComparison.addEventListener('click', function() {
            // Get selected comparison options
            const type = comparisonType.value;
            const metric = comparisonMetric.value;
            const selectedItems = getSelectedComparisonItems();
            
            // Run the comparison with selected options
            runComparisonAnalysis(type, metric, selectedItems);
        });
    }
}

/**
 * Update comparison items based on comparison type
 */
function updateComparisonItems(type) {
    const comparisonItems = document.getElementById('comparison-items');
    
    // Clear current items
    comparisonItems.innerHTML = '';
    
    // Add new items based on type
    switch (type) {
        case 'classes':
            comparisonItems.innerHTML = `
                <div class="multi-select-item">
                    <input type="checkbox" id="item1" checked>
                    <label for="item1">Mathematics 101</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="item2" checked>
                    <label for="item2">Science 202</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="item3">
                    <label for="item3">English 101</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="item4">
                    <label for="item4">History 101</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="item5">
                    <label for="item5">Computer Science 202</label>
                </div>
            `;
            break;
            
        case 'generations':
            comparisonItems.innerHTML = `
                <div class="multi-select-item">
                    <input type="checkbox" id="gen1" checked>
                    <label for="gen1">Class of 2025</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="gen2" checked>
                    <label for="gen2">Class of 2024</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="gen3">
                    <label for="gen3">Class of 2023</label>
                </div>
            `;
            break;
            
        case 'schools':
            comparisonItems.innerHTML = `
                <div class="multi-select-item">
                    <input type="checkbox" id="sch1" checked>
                    <label for="sch1">Seoul Central High School</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="sch2" checked>
                    <label for="sch2">Busan Science Academy</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="sch3">
                    <label for="sch3">Incheon International School</label>
                </div>
            `;
            break;
            
        case 'students':
            comparisonItems.innerHTML = `
                <div class="multi-select-item">
                    <input type="checkbox" id="std1" checked>
                    <label for="std1">Kim Min-ji</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="std2" checked>
                    <label for="std2">Park Ji-hun</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="std3">
                    <label for="std3">Lee Seo-yeon</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="std4">
                    <label for="std4">Choi Joon-ho</label>
                </div>
                <div class="multi-select-item">
                    <input type="checkbox" id="std5">
                    <label for="std5">Han So-mi</label>
                </div>
            `;
            break;
    }
}

/**
 * Get selected comparison items
 */
function getSelectedComparisonItems() {
    const selectedItems = [];
    const checkboxes = document.querySelectorAll('#comparison-items input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        selectedItems.push({
            id: checkbox.id,
            label: checkbox.nextElementSibling.textContent
        });
    });
    
    return selectedItems;
}

/**
 * Run comparison analysis
 */
function runComparisonAnalysis(type, metric, items) {
    console.log('Running comparison:', type, metric, items);
    
    // Show loading state
    showLoadingState();
    
    // Simulate API call delay
    setTimeout(() => {
        // Update comparison chart
        updateComparisonChart(type, metric, items);
        
        // Update stats table
        updateStatsTable(type, metric, items);
        
        // Update correlation chart
        updateCorrelationChart(type, metric, items);
        
        // Hide loading state
        hideLoadingState();
    }, 1000);
}

/**
 * Load sample data for the analytics dashboard when API calls fail or for demo purposes
 */
function loadSampleData() {
    console.log('Loading sample data');
    
    // Update the summary stats cards
    updateSummaryStats({
        totalStudents: 28,
        activeStudents: 24,
        newEnrollments: 3,
        attendanceRate: 78,
        attendanceCompare: 5,
        avgExamScore: 82,
        scoreCompare: 3,
        homeworkCompletion: 91,
        homeworkCompare: 1
    });
    
    // Initialize charts with sample data
    initAllCharts();
}

/**
 * Update summary statistics on the dashboard
 */
function updateSummaryStats(stats) {
    // Update each statistic element with the provided data
    document.getElementById('total-students-stat').textContent = stats.totalStudents;
    document.getElementById('active-students').textContent = `${stats.activeStudents} active`;
    document.getElementById('recent-enrollments').textContent = `${stats.newEnrollments} new`;
    
    document.getElementById('attendance-rate-stat').textContent = `${stats.attendanceRate}%`;
    document.getElementById('attendance-compare').textContent = `+${stats.attendanceCompare}% vs. average`;
    
    document.getElementById('avg-exam-score-stat').textContent = `${stats.avgExamScore}%`;
    document.getElementById('score-compare').textContent = `+${stats.scoreCompare}% vs. previous`;
    
    document.getElementById('homework-completion-stat').textContent = `${stats.homeworkCompletion}%`;
    document.getElementById('homework-compare').textContent = `+${stats.homeworkCompare}% vs. average`;
}

/**
 * Initialize all charts
 */
function initAllCharts() {
    // Make sure Chart.js is loaded
    if (window.Chart) {
        // Clear any existing charts to prevent duplicates
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const chartInstance = Chart.getChart(canvas);
            if (chartInstance) {
                chartInstance.destroy();
            }
        });
        
        // Initialize charts for each tab
        initAttendanceCharts();
        initPerformanceCharts();
        initComparisonCharts();
        initCommentCharts();  // Add this line to initialize comment charts
        
        console.log('All charts initialized successfully');
    } else {
        console.error('Chart.js not loaded, cannot initialize charts');
    }
}

/**
 * Initialize attendance related charts
 */
function initAttendanceCharts() {
    // Attendance Patterns Chart
    const attendancePatternCtx = document.getElementById('attendance-pattern-chart');
    if (attendancePatternCtx) {
        new Chart(attendancePatternCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Attendance Rate',
                    data: [75, 69, 80, 81, 76, 78],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Attendance pattern chart canvas not found');
    }
    
    // Attendance by Day Chart
    const attendanceByDayCtx = document.getElementById('attendance-by-day-chart');
    if (attendanceByDayCtx) {
        new Chart(attendanceByDayCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Attendance Rate by Day',
                    data: [68, 82, 79, 84, 75],
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Attendance by day chart canvas not found');
    }
    
    // Attendance Distribution Chart
    const attendanceDistCtx = document.getElementById('attendance-distribution-chart');
    if (attendanceDistCtx) {
        new Chart(attendanceDistCtx, {
            type: 'pie',
            data: {
                labels: ['90%+', '80-90%', '70-80%', 'Below 70%'],
                datasets: [{
                    data: [12, 8, 5, 3],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(255, 152, 0, 1)',
                        'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Attendance distribution chart canvas not found');
    }
}

/**
 * Initialize performance related charts
 */
function initPerformanceCharts() {
    // Grade Distribution Chart
    const gradeDistCtx = document.getElementById('grade-distribution-chart');
    if (gradeDistCtx) {
        new Chart(gradeDistCtx, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D', 'F'],
                datasets: [{
                    label: 'Number of Students',
                    data: [10, 8, 6, 3, 1],
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Grade distribution chart canvas not found');
    }
    
    // Subject Performance Chart
    const subjectPerfCtx = document.getElementById('subject-performance-chart');
    if (subjectPerfCtx) {
        new Chart(subjectPerfCtx, {
            type: 'radar',
            data: {
                labels: ['Math', 'Science', 'English', 'History', 'Arts'],
                datasets: [{
                    label: 'Class Average',
                    data: [82, 79, 85, 78, 88],
                    borderColor: 'rgba(114, 95, 255, 1)',
                    backgroundColor: 'rgba(114, 95, 255, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(114, 95, 255, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        },
                        pointLabels: {
                            color: '#a3aed0'
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            color: '#a3aed0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Subject performance chart canvas not found');
    }
    
    // Performance vs Attendance Chart
    const perfAttendCtx = document.getElementById('performance-attendance-chart');
    if (perfAttendCtx) {
        new Chart(perfAttendCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Students',
                    data: [
                        { x: 98, y: 95 }, { x: 92, y: 88 }, { x: 85, y: 90 },
                        { x: 76, y: 70 }, { x: 88, y: 82 }, { x: 90, y: 92 },
                        { x: 65, y: 62 }, { x: 72, y: 68 }, { x: 81, y: 80 },
                        { x: 94, y: 89 }, { x: 78, y: 71 }, { x: 86, y: 84 }
                    ],
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Attendance: ${context.parsed.x}%, Score: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Average Score (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Attendance Rate (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                }
            }
        });
    } else {
        console.error('Performance vs attendance chart canvas not found');
    }
}

/**
 * Initialize comparison charts
 */
function initComparisonCharts() {
    // Comparison Chart
    const comparisonCtx = document.getElementById('comparison-chart');
    if (comparisonCtx) {
        new Chart(comparisonCtx, {
            type: 'bar',
            data: {
                labels: ['Attendance', 'Homework', 'Midterm', 'Final'],
                datasets: [
                    {
                        label: 'Mathematics 101',
                        data: [85, 90, 82, 88],
                        backgroundColor: 'rgba(114, 95, 255, 0.7)'
                    },
                    {
                        label: 'Science 202',
                        data: [82, 85, 79, 81],
                        backgroundColor: 'rgba(76, 175, 80, 0.7)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a3aed0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 100,
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Correlation Chart
    const correlationCtx = document.getElementById('correlation-chart');
    if (correlationCtx) {
        new Chart(correlationCtx, {
            type: 'polarArea',
            data: {
                labels: ['Attendance → Grades', 'Homework → Grades', 'Attendance → Homework'],
                datasets: [{
                    data: [0.78, 0.82, 0.65],
                    backgroundColor: [
                        'rgba(114, 95, 255, 0.7)',
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(255, 193, 7, 0.7)'
                    ],
                    borderColor: [
                        'rgba(114, 95, 255, 1)',
                        'rgba(76, 175, 80, 1)',
                        'rgba(255, 193, 7, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            backdropColor: 'transparent',
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a3aed0'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Correlation: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update comparison chart with new data
 */
function updateComparisonChart(type, metric, items) {
    // Get the chart canvas
    const chartCanvas = document.getElementById('comparison-chart');
    
    if (chartCanvas) {
        // Get chart instance
        const chartInstance = Chart.getChart(chartCanvas);
        
        if (chartInstance) {
            // Create labels array based on metric
            let labels = [];
            switch (metric) {
                case 'attendance':
                    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
                    break;
                case 'exam-scores':
                    labels = ['Exam 1', 'Exam 2', 'Exam 3', 'Midterm', 'Exam 4', 'Exam 5', 'Final'];
                    break;
                case 'homework':
                    labels = ['HW 1', 'HW 2', 'HW 3', 'HW 4', 'HW 5', 'HW 6', 'HW 7', 'HW 8', 'HW 9'];
                    break;
                case 'improvement':
                    labels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
                    break;
            }
            
            // Create datasets based on selected items
            const datasets = items.map((item, index) => {
                // Generate random data for demo purposes
                // In a real app, this would come from an API
                const data = generateRandomData(labels.length, metric);
                
                // Set colors based on index
                const colors = [
                    { border: '#725fff', bg: 'rgba(114, 95, 255, 0.1)' }, // Purple
                    { border: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' }, // Blue
                    { border: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' }, // Green
                    { border: '#FF9F43', bg: 'rgba(255, 159, 67, 0.1)' }, // Orange
                    { border: '#F44336', bg: 'rgba(244, 67, 54, 0.1)' }  // Red
                ];
                
                const colorIndex = index % colors.length;
                
                return {
                    label: item.label,
                    data: data,
                    borderColor: colors[colorIndex].border,
                    backgroundColor: colors[colorIndex].bg,
                    tension: 0.3
                };
            });
            
            // Update chart data
            chartInstance.data.labels = labels;
            chartInstance.data.datasets = datasets;
            chartInstance.update();
        }
    }
}

/**
 * Update stats table with comparison data
 */
function updateStatsTable(type, metric, items) {
    const tableBody = document.getElementById('stats-table');
    
    if (tableBody) {
        // Clear table
        tableBody.innerHTML = '';
        
        // Add row for each item
        items.forEach(item => {
            // Generate random stats for demo
            const avg = (70 + Math.random() * 30).toFixed(1);
            const median = (70 + Math.random() * 30).toFixed(1);
            const stdDev = (5 + Math.random() * 5).toFixed(1);
            const min = (60 + Math.random() * 10).toFixed(1);
            const max = (90 + Math.random() * 10).toFixed(1);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.label}</td>
                <td>${avg}%</td>
                <td>${median}%</td>
                <td>${stdDev}</td>
                <td>${min}%</td>
                <td>${max}%</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
}

/**
 * Update correlation chart with new data
 */
function updateCorrelationChart(type, metric, items) {
    const chartCanvas = document.getElementById('correlation-chart');
    
    if (chartCanvas) {
        // Get chart instance
        const chartInstance = Chart.getChart(chartCanvas);
        
        if (chartInstance) {
            // Different correlations based on the selected metric
            let labels = [];
            let data = [];
            
            switch (metric) {
                case 'attendance':
                    labels = ['Overall Grade', 'Homework Completion', 'Classroom Engagement', 'Exam Scores', 'Group Projects'];
                    data = [0.82, 0.65, 0.78, 0.85, 0.60];
                    break;
                case 'exam-scores':
                    labels = ['Attendance', 'Study Hours', 'Homework Scores', 'Class Participation', 'Practice Tests'];
                    data = [0.85, 0.78, 0.80, 0.65, 0.90];
                    break;
                case 'homework':
                    labels = ['Attendance', 'Exam Scores', 'Time Management', 'Understanding', 'Class Engagement'];
                    data = [0.72, 0.80, 0.85, 0.78, 0.68];
                    break;
                case 'improvement':
                    labels = ['Attendance', 'Teacher Feedback', 'Study Hours', 'Practice Problems', 'Peer Study Groups'];
                    data = [0.75, 0.82, 0.88, 0.79, 0.65];
                    break;
            }
            
            // Update chart data
            chartInstance.data.labels = labels;
            chartInstance.data.datasets[0].data = data;
            chartInstance.update();
        }
    }
}

/**
 * Generate random data values for charts
 */
function generateRandomData(count, metricType) {
    const data = [];
    
    // Base values and range depend on the metric
    let baseValue, range;
    
    switch (metricType) {
        case 'attendance':
            baseValue = 75;
            range = 25;
            break;
        case 'exam-scores':
            baseValue = 70;
            range = 30;
            break;
        case 'homework':
            baseValue = 80;
            range = 20;
            break;
        case 'improvement':
            baseValue = 0;
            range = 30;
            break;
        default:
            baseValue = 70;
            range = 30;
    }
    
    // Generate data points with some trend
    let currentValue = baseValue + (Math.random() * range / 2);
    
    for (let i = 0; i < count; i++) {
        // Add some slight randomness but maintain a trend
        let change = (Math.random() - 0.5) * 10;
        
        // For improvement metric, make it trend upward
        if (metricType === 'improvement') {
            change = Math.random() * 5;  // Positive change
            currentValue += change;
            data.push(currentValue);
        } else {
            // Keep values within reasonable bounds
            currentValue += change;
            if (currentValue > baseValue + range) currentValue = baseValue + range;
            if (currentValue < baseValue) currentValue = baseValue;
            
            data.push(currentValue);
        }
    }
    
    return data;
}

/**
 * Update summary statistics cards
 */
function updateSummaryStats(data) {
    // Update student stats
    updateStatCard('total-students', data.students.total);
    updateStatCard('active-students', data.students.active);
    updateStatCard('new-enrollments', data.students.newEnrollments);
    
    // Update attendance rate
    updateStatCard('attendance-rate', data.attendance.rate, '%', data.attendance.comparison);
    
    // Update exam scores
    updateStatCard('avg-score', data.performance.averageScore, '%', data.performance.comparison);
    
    // Update homework completion
    updateStatCard('homework-completion', data.homework.completionRate, '%', data.homework.comparison);
}

/**
 * Update stat card with real data
 */
function updateStatCard(id, value, suffix = '', comparison = null) {
    const statElement = document.getElementById(id);
    if (!statElement) return;
    
    // Update main value
    const valueElement = statElement.querySelector('.stat-value');
    if (valueElement) {
        valueElement.textContent = `${value}${suffix}`;
    }
    
    // Update comparison indicator if it exists
    const comparisonElement = statElement.querySelector('.comparison');
    if (comparisonElement && comparison !== null) {
        const isPositive = comparison > 0;
        const icon = isPositive ? '↑' : '↓';
        const colorClass = isPositive ? 'positive' : 'negative';
        
        comparisonElement.innerHTML = `<span class="${colorClass}">${icon} ${Math.abs(comparison)}${suffix}</span>`;
    }
}

/**
 * Update attendance data in charts and tables
 */
function updateAttendanceData(data) {
    // Update attendance pattern chart (attendance over time)
    if (window.attendancePatternChart && data.patterns) {
        window.attendancePatternChart.data.labels = data.patterns.labels;
        window.attendancePatternChart.data.datasets[0].data = data.patterns.data;
        window.attendancePatternChart.update();
    }
    
    // Update attendance by day chart
    if (window.attendanceByDayChart && data.byDay) {
        window.attendanceByDayChart.data.labels = data.byDay.labels;
        window.attendanceByDayChart.data.datasets[0].data = data.byDay.data;
        window.attendanceByDayChart.update();
    }
    
    // Update attendance distribution chart
    if (window.attendanceDistributionChart && data.distribution) {
        window.attendanceDistributionChart.data.labels = data.distribution.labels;
        window.attendanceDistributionChart.data.datasets[0].data = data.distribution.data;
        window.attendanceDistributionChart.update();
    }
    
    // Update low attendance students table
    updateLowAttendanceTable(data.lowAttendanceStudents || []);
}

/**
 * Update low attendance students table
 */
function updateLowAttendanceTable(students) {
    const tableBody = document.querySelector('#attendance-issues-table tbody');
    if (!tableBody) return;
    
    // Build the table rows
    let tableHTML = '';
    
    if (students.length === 0) {
        tableHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>';
    } else {
        students.forEach(student => {
            tableHTML += `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>${student.rate}%</td>
                    <td>${student.missed}</td>
                    <td>${student.pattern}</td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = tableHTML;
}

/**
 * Update performance data in charts and tables
 */
function updatePerformanceData(data) {
    // Update grade distribution chart
    if (window.gradeDistributionChart && data.gradeDistribution) {
        window.gradeDistributionChart.data.labels = data.gradeDistribution.labels;
        window.gradeDistributionChart.data.datasets[0].data = data.gradeDistribution.data;
        window.gradeDistributionChart.update();
    }
    
    // Update subject performance chart
    if (window.subjectPerformanceChart && data.subjectPerformance) {
        window.subjectPerformanceChart.data.labels = data.subjectPerformance.labels;
        window.subjectPerformanceChart.data.datasets[0].data = data.subjectPerformance.data;
        window.subjectPerformanceChart.update();
    }
    
    // Update performance vs attendance scatter chart
    if (window.performanceAttendanceChart && data.performanceAttendance) {
        window.performanceAttendanceChart.data.datasets[0].data = data.performanceAttendance;
        window.performanceAttendanceChart.update();
    }
    
    // Update top performers table
    updateTopPerformersTable(data.topPerformers || []);
}

/**
 * Update top performers table
 */
function updateTopPerformersTable(performers) {
    const tableBody = document.querySelector('#top-performers-table tbody');
    if (!tableBody) return;
    
    // Build the table rows
    let tableHTML = '';
    
    if (performers.length === 0) {
        tableHTML = '<tr><td colspan="4" class="text-center">No data available</td></tr>';
    } else {
        performers.forEach(student => {
            tableHTML += `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>${student.average}%</td>
                    <td>${student.bestSubject}</td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = tableHTML;
}

/**
 * Display error message
 */
function displayErrorMessage(message) {
    const errorContainer = document.getElementById('analytics-error');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    } else {
        // Create error container if it doesn't exist
        const container = document.querySelector('.analytics-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'analytics-error';
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                background-color: rgba(244, 67, 54, 0.1);
                border-left: 4px solid #f44336;
                color: #f44336;
                padding: 10px 15px;
                margin-bottom: 20px;
                border-radius: 4px;
                display: block;
            `;
            
            // Insert at the top of the container
            container.insertBefore(errorDiv, container.firstChild);
            
            // Auto-hide
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }
}

/**
 * Destroy existing chart instances before creating new ones
 */
function destroyExistingCharts() {
    // List of all chart canvas IDs
    const chartIds = [
        'attendance-pattern-chart',
        'attendance-by-day-chart',
        'attendance-distribution-chart',
        'grade-distribution-chart',
        'subject-performance-chart',
        'performance-attendance-chart',
        'comparison-chart',
        'correlation-chart'
    ];
    
    // Destroy each existing chart
    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const chartInstance = Chart.getChart(canvas);
            if (chartInstance) {
                console.log(`Destroying existing chart: ${id}`);
                chartInstance.destroy();
            }
        }
    });
}

/**
 * Initialize attendance charts
 */
function initAttendanceCharts() {
    console.log('Initializing attendance charts');
    
    // Attendance Pattern Chart
    if (document.getElementById('attendance-pattern-chart')) {
        new Chart(document.getElementById('attendance-pattern-chart'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                datasets: [{
                    label: 'This Semester',
                    data: [85, 82, 80, 78, 83, 85, 86, 88].map(v => v + Math.random() * 5 - 2.5),
                    borderColor: '#725fff',
                    backgroundColor: 'rgba(114, 95, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Previous Semester',
                    data: [80, 78, 76, 75, 77, 79, 80, 82].map(v => v + Math.random() * 5 - 2.5),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    },
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Attendance by Day Chart
    if (document.getElementById('attendance-by-day-chart')) {
        new Chart(document.getElementById('attendance-by-day-chart'), {
            type: 'bar',
            data: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                datasets: [{
                    label: 'Attendance Rate',
                    data: [76, 85, 89, 82, 70].map(v => v + Math.random() * 8 - 4),
                    backgroundColor: [
                        'rgba(114, 95, 255, 0.8)',
                        'rgba(33, 150, 243, 0.8)',
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { 
                            color: '#a3aed0',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Attendance Distribution Chart
    if (document.getElementById('attendance-distribution-chart')) {
        new Chart(document.getElementById('attendance-distribution-chart'), {
            type: 'doughnut',
            data: {
                labels: ['90-100%', '80-89%', '70-79%', '60-69%', 'Below 60%'],
                datasets: [{
                    data: [8, 10, 6, 3, 1].map(v => v + Math.floor(Math.random() * 2)),
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(33, 150, 243, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(255, 87, 34, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
}

/**
 * Initialize performance charts
 */
function initPerformanceCharts() {
    console.log('Initializing performance charts');
    
    // Grade Distribution Chart
    if (document.getElementById('grade-distribution-chart')) {
        new Chart(document.getElementById('grade-distribution-chart'), {
            type: 'bar',
            data: {
                labels: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'],
                datasets: [{
                    label: 'Number of Students',
                    data: [3, 5, 7, 6, 4, 2, 1, 0, 0].map(v => v + Math.floor(Math.random() * 2)),
                    backgroundColor: 'rgba(114, 95, 255, 0.8)',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0', precision: 0 }
                    },
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Subject Performance Chart
    if (document.getElementById('subject-performance-chart')) {
        new Chart(document.getElementById('subject-performance-chart'), {
            type: 'radar',
            data: {
                labels: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'],
                datasets: [{
                    label: 'Average Score',
                    data: [85, 78, 82, 76, 90].map(v => v + Math.random() * 6 - 3),
                    backgroundColor: 'rgba(114, 95, 255, 0.2)',
                    borderColor: '#725fff',
                    borderWidth: 2,
                    pointBackgroundColor: '#725fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            backdropColor: 'transparent',
                            color: '#a3aed0'
                        },
                        pointLabels: {
                            color: '#a3aed0'
                        },
                        grid: {
                            color: 'rgba(163, 174, 208, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Performance vs. Attendance Chart
    if (document.getElementById('performance-attendance-chart')) {
        new Chart(document.getElementById('performance-attendance-chart'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Students',
                    data: [
                        {x: 95, y: 92}, {x: 88, y: 96}, {x: 92, y: 86},
                        {x: 76, y: 69}, {x: 82, y: 78}, {x: 65, y: 58},
                        {x: 78, y: 72}, {x: 86, y: 82}, {x: 94, y: 90},
                        {x: 75, y: 68}, {x: 81, y: 76}, {x: 97, y: 94},
                        {x: 71, y: 65}, {x: 85, y: 80}, {x: 89, y: 84},
                        {x: 60, y: 54}
                    ].map(point => ({
                        x: point.x + Math.random() * 4 - 2,
                        y: point.y + Math.random() * 4 - 2
                    })),
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    borderColor: '#725fff',
                    borderWidth: 1,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Exam Score (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Attendance Rate (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

/**
 * Initialize comparison charts
 */
function initComparisonCharts() {
    console.log('Initializing comparison charts');
    
    // Comparison Chart
    if (document.getElementById('comparison-chart')) {
        new Chart(document.getElementById('comparison-chart'), {
            type: 'bar',
            data: {
                labels: ['Attendance', 'Exam Scores', 'Homework', 'Participation', 'Projects'],
                datasets: [
                    {
                        label: 'Mathematics 101',
                        data: [85, 78, 92, 87, 81].map(v => v + Math.random() * 6 - 3),
                        backgroundColor: 'rgba(114, 95, 255, 0.8)',
                        borderWidth: 0
                    },
                    {
                        label: 'Science 202',
                        data: [82, 80, 86, 84, 78].map(v => v + Math.random() * 6 - 3),
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0', callback: (value) => value + '%' }
                    },
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Correlation Chart
    if (document.getElementById('correlation-chart')) {
        new Chart(document.getElementById('correlation-chart'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Attendance',
                        data: [78, 82, 80, 85, 87, 88].map(v => v + Math.random() * 4 - 2),
                        borderColor: '#725fff',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Performance',
                        data: [75, 78, 82, 84, 86, 89].map(v => v + Math.random() * 4 - 2),
                        borderColor: '#2196F3',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    },
                    title: {
                        display: true,
                        text: 'Attendance & Performance Correlation',
                        color: '#a3aed0'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 70,
                        max: 100,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    },
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
}

/**
 * Update summary stats with the provided data
 */
function updateSummaryStats(data) {
    // Update total students
    if (document.getElementById('total-students-stat')) {
        document.getElementById('total-students-stat').textContent = data.totalStudents || 0;
    }
    
    // Update active students
    if (document.getElementById('active-students')) {
        document.getElementById('active-students').textContent = `${data.activeStudents || 0} active`;
    }
    
    // Update recent enrollments
    if (document.getElementById('recent-enrollments')) {
        document.getElementById('recent-enrollments').textContent = `${data.newEnrollments || 0} new`;
    }
    
    // Update attendance rate
    if (document.getElementById('attendance-rate-stat')) {
        document.getElementById('attendance-rate-stat').textContent = `${data.attendanceRate || 0}%`;
    }
    
    // Update attendance comparison
    if (document.getElementById('attendance-compare')) {
        const compElement = document.getElementById('attendance-compare');
        const compValue = data.attendanceCompare || 0;
        
        compElement.textContent = `${compValue >= 0 ? '+' : ''}${compValue}% vs. average`;
        compElement.className = `stat-comparison ${compValue < 0 ? 'negative' : ''}`;
    }
    
    // Update average exam score
    if (document.getElementById('avg-exam-score-stat')) {
        document.getElementById('avg-exam-score-stat').textContent = `${data.avgExamScore || 0}%`;
    }
    
    // Update score comparison
    if (document.getElementById('score-compare')) {
        const compElement = document.getElementById('score-compare');
        const compValue = data.scoreCompare || 0;
        
        compElement.textContent = `${compValue >= 0 ? '+' : ''}${compValue}% vs. previous`;
        compElement.className = `stat-comparison ${compValue < 0 ? 'negative' : ''}`;
    }
    
    // Update homework completion
    if (document.getElementById('homework-completion-stat')) {
        document.getElementById('homework-completion-stat').textContent = `${data.homeworkCompletion || 0}%`;
    }
    
    // Update homework comparison
    if (document.getElementById('homework-compare')) {
        const compElement = document.getElementById('homework-compare');
        const compValue = data.homeworkCompare || 0;
        
        compElement.textContent = `${compValue >= 0 ? '+' : ''}${compValue}% vs. average`;
        compElement.className = `stat-comparison ${compValue < 0 ? 'negative' : ''}`;
    }
}

/**
 * Load sample data when API calls fail or for demo purposes
 */
function loadSampleData() {
    console.log('Loading sample data');
    
    // Update summary stats with sample data
    updateSummaryStats({
        totalStudents: 28,
        activeStudents: 24,
        newEnrollments: 3,
        attendanceRate: 78,
        attendanceCompare: 5,
        avgExamScore: 82,
        scoreCompare: 3,
        homeworkCompletion: 91,
        homeworkCompare: 1
    });
}

// ...existing code...

/**
 * BrainDB Analytics Module
 * Provides data visualization for student, school, and class performance metrics
 */
(function() {
    // Configuration
    const CHART_COLORS = {
        primary: '#725fff',
        secondary: '#4CAF50',
        warning: '#FFC107',
        danger: '#F44336',
        info: '#2196F3',
        dark: '#363c55',
        light: '#a3aed0',
        primaryGradient: [
            'rgba(114, 95, 255, 0.7)',
            'rgba(114, 95, 255, 0.4)',
            'rgba(114, 95, 255, 0.2)'
        ]
    };
    
    // State management
    let currentScope = 'all';
    let currentFilters = {};
    let chartsInitialized = false;
    
    // Cache for API data
    const dataCache = {
        students: null,
        classes: null,
        schools: null,
        attendance: null,
        exams: null,
        homework: null
    };
    
    // Chart instances
    const charts = {};
    
    /**
     * Initialize the analytics dashboard
     */
    async function initPage() {
        try {
            // Setup event listeners
            setupEventListeners();
            
            // Initialize default scope filters
            updateScopeFilters();
            
            // Fetch initial data and update stats
            showLoading(true);
            await fetchInitialData();
            updateSummaryStats();
            showLoading(false);
            
            // Initialize tab visibility
            initTabs();
            
            // Initialize and render charts
            await initializeCharts();
            
            console.log('Analytics page initialized successfully');
        } catch (error) {
            console.error('Error initializing analytics page:', error);
            showLoading(false);
            showError('Failed to initialize analytics. Please try refreshing the page.');
        }
    }
    
    /**
     * Set up event listeners for UI elements
     */
    function setupEventListeners() {
        // Analysis scope change
        const scopeSelect = document.getElementById('analysis-scope');
        if (scopeSelect) {
            scopeSelect.addEventListener('change', function() {
                currentScope = this.value;
                updateScopeFilters();
            });
        }
        
        // Apply filters button
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', async function() {
                await applyFilters();
            });
        }
        
        // Tab switching
        const tabItems = document.querySelectorAll('.tab-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabItems.forEach(item => item.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding content
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId + '-tab').classList.add('active');
                
                // Update charts in the active tab for better rendering
                updateChartsInActiveTab(tabId);
            });
        });
        
        // Comparison run button
        const runComparisonBtn = document.getElementById('run-comparison');
        if (runComparisonBtn) {
            runComparisonBtn.addEventListener('click', function() {
                runComparison();
            });
        }
    }
    
    /**
     * Update scope filter options based on selection
     */
    function updateScopeFilters() {
        const scope = document.getElementById('analysis-scope').value;
        const container = document.getElementById('scope-filter-container');
        
        let filterHTML = '';
        
        switch(scope) {
            case 'by-class':
                filterHTML = `
                    <label class="filter-label">Select Class</label>
                    <select class="filter-select" id="class-filter">
                        <option value="all">All Classes</option>
                        <option value="math-101">Mathematics 101</option>
                        <option value="science-202">Science 202</option>
                        <option value="english-101">English 101</option>
                        <option value="history-101">History 101</option>
                        <option value="cs-202">Computer Science 202</option>
                    </select>
                    <div class="filter-label" style="margin-top: 10px;">Lecture Sequence View</div>
                    <div class="toggle-container">
                        <input type="checkbox" id="lecture-sequence-toggle" class="toggle-input">
                        <label for="lecture-sequence-toggle" class="toggle-label"></label>
                        <span class="toggle-text">Show lecture progression</span>
                    </div>
                `;
                break;
                
            case 'by-student':
                filterHTML = `
                    <label class="filter-label">Select Student</label>
                    <select class="filter-select" id="student-filter">
                        <option value="all">All Students</option>
                        <option value="student-1">Kim Min-ji</option>
                        <option value="student-2">Park Ji-hun</option>
                        <option value="student-3">Lee Seo-yeon</option>
                        <option value="student-4">Han So-mi</option>
                        <option value="student-5">Kang Tae-woo</option>
                    </select>
                    <div class="filter-label" style="margin-top: 10px;">Semester Selection</div>
                    <div class="multi-select-container" style="max-height: 120px">
                        <div class="multi-select-item">
                            <input type="checkbox" id="sem-2025-1" checked>
                            <label for="sem-2025-1">2025 Spring</label>
                        </div>
                        <div class="multi-select-item">
                            <input type="checkbox" id="sem-2024-2">
                            <label for="sem-2024-2">2024 Fall</label>
                        </div>
                        <div class="multi-select-item">
                            <input type="checkbox" id="sem-2024-1">
                            <label for="sem-2024-1">2024 Spring</label>
                        </div>
                        <div class="multi-select-item">
                            <input type="checkbox" id="sem-2023-2">
                            <label for="sem-2023-2">2023 Fall</label>
                        </div>
                    </div>
                `;
                break;
                
            case 'by-school':
                filterHTML = `
                    <label class="filter-label">Select School</label>
                    <select class="filter-select" id="school-filter">
                        <option value="all">All Schools</option>
                        <option value="school-1">Seoul International</option>
                        <option value="school-2">Busan Academy</option>
                        <option value="school-3">Daegu High School</option>
                    </select>
                    <div class="filter-label" style="margin-top: 10px;">Generation</div>
                    <select class="filter-select" id="generation-filter">
                        <option value="all">All Generations</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                    </select>
                `;
                break;
                
            default:
                filterHTML = '<p class="filter-label">No additional filters needed</p>';
        }
        
        container.innerHTML = filterHTML;
        
        // Set up any additional event listeners for new elements
        if (scope === 'by-class') {
            const lectureToggle = document.getElementById('lecture-sequence-toggle');
            if (lectureToggle) {
                lectureToggle.addEventListener('change', function() {
                    if (this.checked) {
                        // Show lecture sequence specific charts
                        showLectureSequenceView();
                    } else {
                        // Show regular class view
                        showRegularClassView();
                    }
                });
            }
        }
    }
    
    /**
     * Show lecture sequence specific charts
     */
    function showLectureSequenceView() {
        // Add a custom section for lecture sequence if not exists
        if (!document.getElementById('lecture-sequence-view')) {
            const parentTab = document.getElementById('attendance-tab');
            
            if (parentTab) {
                // Create a new section for lecture sequence charts
                const lectureSequenceView = document.createElement('div');
                lectureSequenceView.id = 'lecture-sequence-view';
                lectureSequenceView.className = 'chart-row';
                lectureSequenceView.innerHTML = `
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title">Attendance by Lecture</div>
                        </div>
                        <div class="chart-body">
                            <canvas id="lecture-attendance-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <div class="chart-title">Performance by Lecture</div>
                        </div>
                        <div class="chart-body">
                            <canvas id="lecture-performance-chart"></canvas>
                        </div>
                    </div>
                `;
                
                // Insert before the first chart row
                const firstChartRow = parentTab.querySelector('.chart-row');
                if (firstChartRow) {
                    parentTab.insertBefore(lectureSequenceView, firstChartRow);
                } else {
                    parentTab.appendChild(lectureSequenceView);
                }
                
                // Initialize the lecture sequence charts
                initLectureSequenceCharts();
            }
        } else {
            document.getElementById('lecture-sequence-view').style.display = 'grid';
        }
    }
    
    /**
     * Hide lecture sequence specific charts
     */
    function showRegularClassView() {
        const lectureSequenceView = document.getElementById('lecture-sequence-view');
        if (lectureSequenceView) {
            lectureSequenceView.style.display = 'none';
        }
    }
    
    /**
     * Initialize charts for lecture sequence view
     */
    function initLectureSequenceCharts() {
        // Lecture attendance chart
        const lectureAttendanceCtx = document.getElementById('lecture-attendance-chart');
        if (lectureAttendanceCtx) {
            new Chart(lectureAttendanceCtx, {
                type: 'line',
                data: {
                    labels: ['Lecture 1', 'Lecture 2', 'Lecture 3', 'Lecture 4', 'Lecture 5', 'Lecture 6', 'Lecture 7', 'Lecture 8'],
                    datasets: [{
                        label: 'Attendance Rate',
                        data: [95, 90, 85, 88, 92, 86, 89, 91],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#a3aed0' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Attendance: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 50,
                            max: 100,
                            ticks: { 
                                color: '#a3aed0',
                                callback: value => value + '%'
                            },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#a3aed0' },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
        
        // Lecture performance chart
        const lecturePerformanceCtx = document.getElementById('lecture-performance-chart');
        if (lecturePerformanceCtx) {
            new Chart(lecturePerformanceCtx, {
                type: 'bar',
                data: {
                    labels: ['Quiz 1', 'Quiz 2', 'Midterm', 'Quiz 3', 'Quiz 4', 'Final'],
                    datasets: [{
                        label: 'Average Score',
                        data: [78, 82, 76, 85, 88, 80],
                        backgroundColor: 'rgba(114, 95, 255, 0.7)',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#a3aed0' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Average: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 50,
                            max: 100,
                            ticks: { 
                                color: '#a3aed0',
                                callback: value => value + '%'
                            },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#a3aed0' },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Initialize and render all charts
     */
    async function initializeCharts() {
        if (chartsInitialized) {
            return;
        }
        
        try {
            // Load Chart.js from CDN if needed
            await loadChartJsIfNeeded();
            
            // Initialize attendance charts
            initAttendanceCharts();
            
            // Initialize performance charts
            initPerformanceCharts();
            
            // Initialize comment analysis charts
            initCommentCharts();
            
            // Initialize comparison chart
            initComparisonChart();
            
            chartsInitialized = true;
            
        } catch (error) {
            console.error('Error initializing charts:', error);
            showError('Failed to initialize charts. Please try refreshing the page.');
        }
    }
    
    /**
     * Load Chart.js from CDN if it's not already loaded
     */
    async function loadChartJsIfNeeded() {
        return new Promise((resolve, reject) => {
            // Check if Chart is already defined
            if (window.Chart) {
                resolve();
                return;
            }
            
            // Load Chart.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.async = true;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize tabs visibility
     */
    function initTabs() {
        const tabItems = document.querySelectorAll('.tab-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Set initial state - first tab active
        if (tabItems.length > 0) {
            tabItems[0].classList.add('active');
        }
        
        if (tabContents.length > 0) {
            tabContents[0].classList.add('active');
        }
    }
    
    /**
     * Initialize attendance analysis charts
     */
    function initAttendanceCharts() {
        // Attendance patterns chart (line chart)
        const attendancePatternCtx = document.getElementById('attendance-pattern-chart');
        if (attendancePatternCtx) {
            charts.attendancePattern = new Chart(attendancePatternCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                    datasets: [{
                        label: 'Weekly Attendance',
                        data: [92, 88, 85, 86, 90, 89, 91, 93],
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: 'rgba(114, 95, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: CHART_COLORS.light }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Attendance: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 50,
                            max: 100,
                            ticks: { 
                                color: CHART_COLORS.light,
                                callback: value => value + '%'
                            },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
        
        // Attendance by day chart (bar chart)
        const attendanceByDayCtx = document.getElementById('attendance-by-day-chart');
        if (attendanceByDayCtx) {
            charts.attendanceByDay = new Chart(attendanceByDayCtx, {
                type: 'bar',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    datasets: [{
                        label: 'Attendance by Day',
                        data: [82, 88, 90, 86, 78],
                        backgroundColor: CHART_COLORS.primaryGradient,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: CHART_COLORS.light }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Attendance: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 50,
                            max: 100,
                            ticks: { 
                                color: CHART_COLORS.light,
                                callback: value => value + '%'
                            },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
        
        // Attendance distribution chart (doughnut chart)
        const attendanceDistributionCtx = document.getElementById('attendance-distribution-chart');
        if (attendanceDistributionCtx) {
            charts.attendanceDistribution = new Chart(attendanceDistributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Present', 'Absent', 'Late', 'Excused'],
                    datasets: [{
                        data: [78, 8, 10, 4],
                        backgroundColor: [
                            CHART_COLORS.secondary,
                            CHART_COLORS.danger,
                            CHART_COLORS.warning,
                            CHART_COLORS.info
                        ],
                        borderWidth: 0,
                        hoverOffset: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: CHART_COLORS.light }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const label = context.label;
                                    return `${label}: ${value}%`;
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    }
    
    /**
     * Initialize performance analysis charts
     */
    function initPerformanceCharts() {
        // Grade distribution chart (bar chart)
        const gradeDistributionCtx = document.getElementById('grade-distribution-chart');
        if (gradeDistributionCtx) {
            charts.gradeDistribution = new Chart(gradeDistributionCtx, {
                type: 'bar',
                data: {
                    labels: ['A', 'B', 'C', 'D', 'F'],
                    datasets: [{
                        label: 'Grade Distribution',
                        data: [35, 42, 15, 6, 2],
                        backgroundColor: [
                            'rgba(76, 175, 80, 0.7)',
                            'rgba(33, 150, 243, 0.7)',
                            'rgba(255, 193, 7, 0.7)',
                            'rgba(255, 152, 0, 0.7)',
                            'rgba(244, 67, 54, 0.7)'
                        ],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Students: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: { 
                                color: CHART_COLORS.light,
                                callback: value => value + '%'
                            },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
        
        // Subject performance chart (radar chart)
        const subjectPerformanceCtx = document.getElementById('subject-performance-chart');
        if (subjectPerformanceCtx) {
            charts.subjectPerformance = new Chart(subjectPerformanceCtx, {
                type: 'radar',
                data: {
                    labels: ['Mathematics', 'Science', 'English', 'History', 'Computer Science'],
                    datasets: [{
                        label: 'Average Performance',
                        data: [85, 78, 82, 75, 88],
                        backgroundColor: 'rgba(114, 95, 255, 0.3)',
                        borderColor: CHART_COLORS.primary,
                        pointBackgroundColor: CHART_COLORS.primary,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: CHART_COLORS.primary
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: CHART_COLORS.light }
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                color: 'rgba(163, 174, 208, 0.1)'
                            },
                            grid: {
                                color: 'rgba(163, 174, 208, 0.1)'
                            },
                            pointLabels: {
                                color: CHART_COLORS.light
                            },
                            ticks: {
                                color: CHART_COLORS.light,
                                backdropColor: 'transparent',
                                showLabelBackdrop: false
                            }
                        }
                    },
                    elements: {
                        line: {
                            borderWidth: 2
                        }
                    }
                }
            });
        }
        
        // Performance vs attendance chart (scatter chart)
        const performanceAttendanceCtx = document.getElementById('performance-attendance-chart');
        if (performanceAttendanceCtx) {
            charts.performanceAttendance = new Chart(performanceAttendanceCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Students',
                        data: [
                            { x: 95, y: 92 },
                            { x: 88, y: 85 },
                            { x: 75, y: 68 },
                            { x: 82, y: 76 },
                            { x: 90, y: 82 },
                            { x: 72, y: 65 },
                            { x: 98, y: 94 },
                            { x: 85, y: 77 },
                            { x: 91, y: 86 },
                            { x: 79, y: 72 },
                            { x: 95, y: 89 },
                            { x: 65, y: 60 },
                            { x: 80, y: 74 },
                            { x: 85, y: 84 },
                            { x: 92, y: 88 }
                        ],
                        backgroundColor: 'rgba(114, 95, 255, 0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Attendance: ${context.parsed.x}%, Score: ${context.parsed.y}%`;
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Exam Score (%)',
                                color: CHART_COLORS.light
                            },
                            min: 50,
                            max: 100,
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Attendance Rate (%)',
                                color: CHART_COLORS.light
                            },
                            min: 50,
                            max: 100,
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Initialize comment analysis charts
     */
    function initCommentCharts() {
        // Comment classification chart (pie chart)
        const commentClassificationCtx = document.getElementById('comment-classification-chart');
        if (commentClassificationCtx) {
            charts.commentClassification = new Chart(commentClassificationCtx, {
                type: 'pie',
                data: {
                    labels: ['Positive Feedback', 'Needs Improvement', 'Constructive Criticism', 'General Observations'],
                    datasets: [{
                        data: [45, 23, 37, 19],
                        backgroundColor: [
                            CHART_COLORS.secondary,
                            CHART_COLORS.danger,
                            CHART_COLORS.info,
                            CHART_COLORS.warning
                        ],
                        borderWidth: 0,
                        hoverOffset: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: CHART_COLORS.light }
                        }
                    }
                }
            });
        }
        
        // Comment keywords chart (horizontal bar chart)
        const commentKeywordsCtx = document.getElementById('comment-keywords-chart');
        if (commentKeywordsCtx) {
            charts.commentKeywords = new Chart(commentKeywordsCtx, {
                type: 'bar',
                data: {
                    labels: ['Understanding', 'Clear', 'Improvement', 'Practice', 'Good', 'Review', 'Concept', 'Effort', 'Detailed', 'Attention'],
                    datasets: [{
                        axis: 'y',
                        label: 'Frequency',
                        data: [48, 42, 38, 35, 32, 30, 28, 25, 22, 18],
                        backgroundColor: 'rgba(114, 95, 255, 0.7)',
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Initialize comparison chart
     */
    function initComparisonChart() {
        // Comparison chart (grouped bar chart)
        const comparisonChartCtx = document.getElementById('comparison-chart');
        if (comparisonChartCtx) {
            charts.comparison = new Chart(comparisonChartCtx, {
                type: 'bar',
                data: {
                    labels: ['Attendance', 'Exam Scores', 'Homework Completion'],
                    datasets: [
                        {
                            label: 'Mathematics 101',
                            data: [85, 82, 90],
                            backgroundColor: 'rgba(114, 95, 255, 0.7)',
                            borderRadius: 4
                        },
                        {
                            label: 'Science 202',
                            data: [80, 78, 85],
                            backgroundColor: 'rgba(33, 150, 243, 0.7)',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: CHART_COLORS.light }
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            ticks: { 
                                color: CHART_COLORS.light,
                                callback: value => value + '%'
                            },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        },
                        x: {
                            ticks: { color: CHART_COLORS.light },
                            grid: { color: 'rgba(163, 174, 208, 0.1)' }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Update charts in the active tab
     * This is needed for proper chart rendering
     */
    function updateChartsInActiveTab(tabId) {
        if (!charts) return;
        
        switch(tabId) {
            case 'attendance':
                if (charts.attendancePattern) charts.attendancePattern.update();
                if (charts.attendanceByDay) charts.attendanceByDay.update();
                if (charts.attendanceDistribution) charts.attendanceDistribution.update();
                break;
                
            case 'performance':
                if (charts.gradeDistribution) charts.gradeDistribution.update();
                if (charts.subjectPerformance) charts.subjectPerformance.update();
                if (charts.performanceAttendance) charts.performanceAttendance.update();
                break;
                
            case 'comments':
                if (charts.commentClassification) charts.commentClassification.update();
                if (charts.commentKeywords) charts.commentKeywords.update();
                break;
                
            case 'comparison':
                if (charts.comparison) charts.comparison.update();
                break;
        }
    }
    
    /**
     * Fetch initial data
     */
    async function fetchInitialData() {
        try {
            // In a real app, these would be API calls to your backend
            // For now, we'll use dummy data
            
            // Simulating API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Load student data
            dataCache.students = [
                { id: 'S1', name: 'Kim Min-ji', school: 'Seoul International', status: 'active' },
                { id: 'S2', name: 'Park Ji-hun', school: 'Busan Academy', status: 'active' },
                { id: 'S3', name: 'Lee Seo-yeon', school: 'Daegu High School', status: 'inactive' },
                // Additional student data would be here
            ];
            
            // Load class data
            dataCache.classes = [
                { id: 'C1', name: 'Mathematics 101', school: 'Seoul International', status: 'active' },
                { id: 'C2', name: 'Science 202', school: 'Busan Academy', status: 'active' },
                { id: 'C3', name: 'English 101', school: 'Daegu High School', status: 'active' },
                // Additional class data would be here
            ];
            
            // Load school data
            dataCache.schools = [
                { id: 'SC1', name: 'Seoul International', location: 'Seoul', status: 'active' },
                { id: 'SC2', name: 'Busan Academy', location: 'Busan', status: 'active' },
                { id: 'SC3', name: 'Daegu High School', location: 'Daegu', status: 'active' },
                // Additional school data would be here
            ];
            
            // Load attendance data
            dataCache.attendance = generateAttendanceData();
            
            // Load exam data
            dataCache.exams = generateExamData();
            
            // Load homework data
            dataCache.homework = generateHomeworkData();
            
            return true;
            
        } catch (error) {
            console.error('Error fetching initial data:', error);
            showError('Failed to fetch data. Please try refreshing the page.');
            return false;
        }
    }
    
    /**
     * Generate dummy attendance data for demo purposes
     */
    function generateAttendanceData() {
        const students = ['S1', 'S2', 'S3', 'S4', 'S5'];
        const classes = ['C1', 'C2', 'C3'];
        const status = ['present', 'absent', 'late', 'excused'];
        const result = [];
        
        // Generate random attendance data for each student and class
        for (let student of students) {
            for (let classId of classes) {
                for (let week = 1; week <= 8; week++) {
                    // Weight towards 'present' status
                    const randomStatus = Math.random() < 0.8 ? status[0] : status[Math.floor(Math.random() * status.length)];
                    
                    result.push({
                        student_id: student,
                        class_id: classId,
                        week: week,
                        status: randomStatus,
                        date: `2023-${Math.floor(Math.random() * 3) + 9}-${Math.floor(Math.random() * 28) + 1}`
                    });
                }
            }
        }
        
        return result;
    }
    
    /**
     * Generate dummy exam data for demo purposes
     */
    function generateExamData() {
        const students = ['S1', 'S2', 'S3', 'S4', 'S5'];
        const classes = ['C1', 'C2', 'C3'];
        const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science'];
        const result = [];
        
        // Generate random exam data for each student and subject
        for (let student of students) {
            for (let classId of classes) {
                for (let subject of subjects) {
                    const score = Math.floor(Math.random() * 31) + 70; // Score between 70-100
                    
                    // Generate a comment based on the score
                    let comment = '';
                    if (score >= 90) {
                        comment = 'Excellent understanding of concepts. Great work!';
                    } else if (score >= 80) {
                        comment = 'Good performance. Shows strong grasp of material.';
                    } else if (score >= 70) {
                        comment = 'Satisfactory work, but could improve in certain areas.';
                    } else {
                        comment = 'Needs additional review and practice.';
                    }
                    
                    result.push({
                        student_id: student,
                        class_id: classId,
                        subject: subject,
                        score: score,
                        comment: comment,
                        date: `2023-${Math.floor(Math.random() * 3) + 9}-${Math.floor(Math.random() * 28) + 1}`
                    });
                }
            }
        }
        
        return result;
    }
    
    /**
     * Generate dummy homework data for demo purposes
     */
    function generateHomeworkData() {
        const students = ['S1', 'S2', 'S3', 'S4', 'S5'];
        const classes = ['C1', 'C2', 'C3'];
        const status = ['completed', 'incomplete', 'late'];
        const result = [];
        
        // Generate random homework data for each student and class
        for (let student of students) {
            for (let classId of classes) {
                for (let week = 1; week <= 8; week++) {
                    // Weight towards 'completed' status
                    const randomStatus = Math.random() < 0.85 ? status[0] : status[Math.floor(Math.random() * status.length)];
                    const score = randomStatus === 'completed' ? Math.floor(Math.random() * 31) + 70 : Math.floor(Math.random() * 70);
                    
                    result.push({
                        student_id: student,
                        class_id: classId,
                        week: week,
                        status: randomStatus,
                        score: score,
                        date: `2023-${Math.floor(Math.random() * 3) + 9}-${Math.floor(Math.random() * 28) + 1}`
                    });
                }
            }
        }
        
        return result;
    }
    
    /**
     * Update summary stats in the dashboard
     */
    function updateSummaryStats() {
        // Total students
        const totalStudentsElement = document.getElementById('total-students-stat');
        if (totalStudentsElement && dataCache.students) {
            totalStudentsElement.textContent = dataCache.students.length;
        }
        
        // Active students
        const activeStudentsElement = document.getElementById('active-students');
        if (activeStudentsElement && dataCache.students) {
            const activeCount = dataCache.students.filter(s => s.status === 'active').length;
            activeStudentsElement.textContent = `${activeCount} active`;
        }
        
        // Attendance rate
        const attendanceRateElement = document.getElementById('attendance-rate-stat');
        if (attendanceRateElement && dataCache.attendance) {
            const presentCount = dataCache.attendance.filter(a => a.status === 'present').length;
            const totalCount = dataCache.attendance.length;
            const rate = Math.round((presentCount / totalCount) * 100);
            attendanceRateElement.textContent = `${rate}%`;
        }
        
        // Average exam score
        const avgExamScoreElement = document.getElementById('avg-exam-score-stat');
        if (avgExamScoreElement && dataCache.exams) {
            const totalScore = dataCache.exams.reduce((sum, exam) => sum + exam.score, 0);
            const avgScore = Math.round(totalScore / dataCache.exams.length);
            avgExamScoreElement.textContent = `${avgScore}%`;
        }
        
        // Homework completion rate
        const homeworkCompletionElement = document.getElementById('homework-completion-stat');
        if (homeworkCompletionElement && dataCache.homework) {
            const completedCount = dataCache.homework.filter(hw => hw.status === 'completed').length;
            const totalCount = dataCache.homework.length;
            const rate = Math.round((completedCount / totalCount) * 100);
            homeworkCompletionElement.textContent = `${rate}%`;
        }
    }
    
    /**
     * Apply selected filters and update data
     */
    async function applyFilters() {
        try {
            showLoading(true);
            
            // Get selected scope and filters
            const scope = document.getElementById('analysis-scope').value;
            const timePeriod = document.getElementById('time-period').value;
            
            // Collect additional filters based on scope
            let additionalFilters = {};
            
            switch(scope) {
                case 'by-class':
                    const classFilter = document.getElementById('class-filter');
                    if (classFilter) {
                        additionalFilters.class = classFilter.value;
                    }
                    break;
                    
                case 'by-student':
                    const studentFilter = document.getElementById('student-filter');
                    if (studentFilter) {
                        additionalFilters.student = studentFilter.value;
                    }
                    
                    // Get selected semesters
                    const selectedSemesters = [];
                    document.querySelectorAll('.multi-select-item input[type="checkbox"]:checked').forEach(checkbox => {
                        selectedSemesters.push(checkbox.id);
                    });
                    additionalFilters.semesters = selectedSemesters;
                    break;
                    
                case 'by-school':
                    const schoolFilter = document.getElementById('school-filter');
                    if (schoolFilter) {
                        additionalFilters.school = schoolFilter.value;
                    }
                    
                    const generationFilter = document.getElementById('generation-filter');
                    if (generationFilter) {
                        additionalFilters.generation = generationFilter.value;
                    }
                    break;
            }
            
            // Store current filters
            currentFilters = {
                scope: scope,
                timePeriod: timePeriod,
                ...additionalFilters
            };
            
            // Update data based on filters
            await updateDataWithFilters(currentFilters);
            
            // Update UI elements
            updateChartsWithFilteredData();
            updateSummaryStats();
            
            showLoading(false);
            
        } catch (error) {
            console.error('Error applying filters:', error);
            showError('Failed to apply filters. Please try again.');
            showLoading(false);
        }
    }
    
    /**
     * Update data with the applied filters (dummy implementation)
     */
    async function updateDataWithFilters(filters) {
        // In a real application, this would make API calls with the filters
        // For now, we'll just simulate a delay and return existing data
        
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // For now, we just log the filters
        console.log('Applied filters:', filters);
        
        return true;
    }
    
    /**
     * Update charts with the filtered data
     */
    function updateChartsWithFilteredData() {
        // In a real application, this would update all chart data
        // For now, we'll just simulate with random data updates
        
        // Update attendance pattern chart with random data
        if (charts.attendancePattern) {
            const newData = Array(8).fill(0).map(() => Math.floor(Math.random() * 15) + 80);
            charts.attendancePattern.data.datasets[0].data = newData;
            charts.attendancePattern.update();
        }
        
        // Update other charts similarly
        // This is just a placeholder for demonstration
        
        console.log('Charts updated with filtered data');
    }
    
    /**
     * Run the comparison analysis
     */
    function runComparison() {
        try {
            showLoading(true);
            
            // Get comparison parameters
            const comparisonType = document.getElementById('comparison-type').value;
            const comparisonMetric = document.getElementById('comparison-metric').value;
            
            // Get selected items for comparison
            const selectedItems = [];
            document.querySelectorAll('#comparison-items input[type="checkbox"]:checked').forEach(checkbox => {
                selectedItems.push(checkbox.id);
            });
            
            // Update comparison chart with new data
            updateComparisonChart(comparisonType, comparisonMetric, selectedItems);
            
            // Update stats table
            updateStatsTable(comparisonType, comparisonMetric, selectedItems);
            
            showLoading(false);
            
        } catch (error) {
            console.error('Error running comparison:', error);
            showError('Failed to run comparison. Please try again.');
            showLoading(false);
        }
    }
    
    /**
     * Update the comparison chart with new data
     */
    function updateComparisonChart(comparisonType, metric, selectedItems) {
        if (!charts.comparison) return;
        
        // In a real app, this would fetch data based on the selection
        // For now, we'll simulate with random data
        
        // Generate labels and datasets based on comparison type
        let labels = [];
        let datasets = [];
        
        // Set appropriate labels based on the selected metric
        switch(metric) {
            case 'attendance':
                labels = ['Overall', 'On-time', 'Late', 'Absent'];
                break;
                
            case 'exam-scores':
                labels = ['Average', 'Midterm', 'Final', 'Quizzes'];
                break;
                
            case 'homework':
                labels = ['Completion', 'On-time', 'Quality', 'Timeliness'];
                break;
                
            case 'improvement':
                labels = ['Start', 'Mid-term', 'End-term', 'Overall'];
                break;
        }
        
        // Create datasets for each selected item
        const items = ['Mathematics 101', 'Science 202', 'English 101', 'History 101', 'Computer Science 202'];
        
        // Use only the selected items
        const selectedIndices = selectedItems.map(item => parseInt(item.replace('item', '')) - 1);
        
        // Create color array for datasets
        const colors = [
            'rgba(114, 95, 255, 0.7)',
            'rgba(33, 150, 243, 0.7)',
            'rgba(76, 175, 80, 0.7)',
            'rgba(255, 152, 0, 0.7)',
            'rgba(244, 67, 54, 0.7)'
        ];
        
        // Generate datasets for selected items
        datasets = selectedIndices.map((index, i) => {
            return {
                label: items[index],
                data: Array(labels.length).fill(0).map(() => Math.floor(Math.random() * 20) + 70),
                backgroundColor: colors[i % colors.length],
                borderRadius: 4
            };
        });
        
        // Update the chart
        charts.comparison.data.labels = labels;
        charts.comparison.data.datasets = datasets;
        charts.comparison.update();
    }
    
    /**
     * Update the statistical analysis table
     */
    function updateStatsTable(comparisonType, metric, selectedItems) {
        const statsTable = document.getElementById('stats-table');
        if (!statsTable) return;
        
        // Clear existing rows
        statsTable.innerHTML = '';
        
        // In a real app, this would show actual statistical analysis
        // For now, we'll create dummy data
        
        // Use only the selected items
        const items = ['Mathematics 101', 'Science 202', 'English 101', 'History 101', 'Computer Science 202'];
        const selectedIndices = selectedItems.map(item => parseInt(item.replace('item', '')) - 1);
        
        // Create a row for each selected item
        selectedIndices.forEach(index => {
            const tr = document.createElement('tr');
            
            // Item name
            const tdName = document.createElement('td');
            tdName.textContent = items[index];
            tr.appendChild(tdName);
            
            // Average
            const tdAvg = document.createElement('td');
            tdAvg.textContent = (Math.floor(Math.random() * 15) + 75) + '%';
            tr.appendChild(tdAvg);
            
            // Median
            const tdMedian = document.createElement('td');
            tdMedian.textContent = (Math.floor(Math.random() * 15) + 75) + '%';
            tr.appendChild(tdMedian);
            
            // Standard Deviation
            const tdStdDev = document.createElement('td');
            tdStdDev.textContent = (Math.floor(Math.random() * 10) + 1).toFixed(1);
            tr.appendChild(tdStdDev);
            
            // Min
            const tdMin = document.createElement('td');
            tdMin.textContent = (Math.floor(Math.random() * 10) + 60) + '%';
            tr.appendChild(tdMin);
            
            // Max
            const tdMax = document.createElement('td');
            tdMax.textContent = (Math.floor(Math.random() * 10) + 90) + '%';
            tr.appendChild(tdMax);
            
            // Add row to table
            statsTable.appendChild(tr);
        });
    }
    
    /**
     * Show or hide the loading indicator
     */
    function showLoading(show) {
        const loadingIndicator = document.getElementById('analytics-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Show an error message
     */
    function showError(message) {
        // In a real application, this would display a proper error message
        // For now, we'll just log to console
        console.error(message);
        alert(message);
    }
    
    // Wait for DOM to be fully loaded, then initialize
    document.addEventListener('DOMContentLoaded', initPage);
})();

/**
 * Initialize comment analysis charts and tables
 */
function initCommentCharts() {
    console.log('Initializing comment analysis charts');
    
    // Comment sentiment distribution chart
    const sentimentChartCtx = document.getElementById('comment-sentiment-chart');
    if (sentimentChartCtx) {
        new Chart(sentimentChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Comment keywords chart
    const keywordsChartCtx = document.getElementById('comment-keywords-chart');
    if (keywordsChartCtx) {
        new Chart(keywordsChartCtx, {
            type: 'bar',
            data: {
                labels: ['Understanding', 'Homework', 'Difficulty', 'Interesting', 'Help', 'Concept', 'Practice', 'Exam', 'Clear', 'Confused'],
                datasets: [{
                    label: 'Frequency',
                    data: [28, 24, 20, 18, 15, 14, 12, 10, 8, 6],
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    },
                    y: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Comment trends over time
    const trendChartCtx = document.getElementById('comment-trend-chart');
    if (trendChartCtx) {
        new Chart(trendChartCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Positive',
                        data: [12, 15, 18, 14, 20, 22],
                        borderColor: 'rgba(76, 175, 80, 0.8)',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Neutral',
                        data: [8, 7, 9, 8, 10, 8],
                        borderColor: 'rgba(255, 193, 7, 0.8)',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Negative',
                        data: [5, 3, 2, 4, 2, 1],
                        borderColor: 'rgba(244, 67, 54, 0.8)',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a3aed0' }
                    }
                },
                scales: {
                    y: {
                        stacked: false,
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    },
                    x: {
                        grid: { color: 'rgba(163, 174, 208, 0.1)' },
                        ticks: { color: '#a3aed0' }
                    }
                }
            }
        });
    }
    
    // Update the comment analysis table with sample data
    updateCommentTable(generateSampleCommentData());
}

/**
 * Generate sample comment data for demonstration
 */
function generateSampleCommentData() {
    return [
        {
            id: 1,
            student: 'Kim Min-ji',
            class: 'Mathematics 101',
            comment: 'I found the concepts challenging but the examples really helped me understand.',
            sentiment: 'Positive',
            date: '2025-05-01',
            keywords: ['challenging', 'examples', 'understand']
        },
        {
            id: 2,
            student: 'Park Ji-hun',
            class: 'Science 202',
            comment: 'The experiment was interesting but I need more practice with the formulas.',
            sentiment: 'Neutral',
            date: '2025-05-02',
            keywords: ['experiment', 'interesting', 'practice', 'formulas']
        },
        {
            id: 3,
            student: 'Lee Seo-yeon',
            class: 'English 101',
            comment: 'Great discussion today! I enjoyed the group work.',
            sentiment: 'Positive',
            date: '2025-05-03',
            keywords: ['discussion', 'enjoyed', 'group work']
        },
        {
            id: 4,
            student: 'Han So-mi',
            class: 'History 101',
            comment: 'I\'m confused about the timeline we covered. Could we review it next class?',
            sentiment: 'Negative',
            date: '2025-05-04',
            keywords: ['confused', 'timeline', 'review']
        },
        {
            id: 5,
            student: 'Kang Tae-woo',
            class: 'Computer Science 202',
            comment: 'The coding exercise was helpful but I\'m still struggling with the algorithms.',
            sentiment: 'Neutral',
            date: '2025-05-05',
            keywords: ['coding', 'helpful', 'struggling', 'algorithms']
        }
    ];
}

/**
 * Update the comment analysis table with actual data
 */
function updateCommentTable(comments) {
    const tableBody = document.getElementById('comments-table-body');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    comments.forEach(comment => {
        const row = document.createElement('tr');
        
        // Create sentiment badge with appropriate color
        let sentimentClass = '';
        switch(comment.sentiment) {
            case 'Positive':
                sentimentClass = 'bg-success';
                break;
            case 'Neutral':
                sentimentClass = 'bg-warning';
                break;
            case 'Negative':
                sentimentClass = 'bg-danger';
                break;
        }
        
        const sentimentBadge = `<span class="sentiment-badge ${sentimentClass}">${comment.sentiment}</span>`;
        
        // Create keywords badges
        const keywordBadges = comment.keywords.map(keyword => 
            `<span class="keyword-badge">${keyword}</span>`
        ).join(' ');
        
        // Add cells to the row
        row.innerHTML = `
            <td>${comment.student}</td>
            <td>${comment.class}</td>
            <td>${comment.comment}</td>
            <td>${sentimentBadge}</td>
            <td>${comment.date}</td>
            <td>${keywordBadges}</td>
            <td>
                <button class="action-btn view-btn" data-comment-id="${comment.id}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3C4.36364 3 1.25818 5.18182 0 8C1.25818 10.8182 4.36364 13 8 13C11.6364 13 14.7418 10.8182 16 8C14.7418 5.18182 11.6364 3 8 3ZM8 11.5C5.99273 11.5 4.36364 9.93091 4.36364 8C4.36364 6.06909 5.99273 4.5 8 4.5C10.0073 4.5 11.6364 6.06909 11.6364 8C11.6364 9.93091 10.0073 11.5 8 11.5ZM8 6C6.89455 6 6 6.89455 6 8C6 9.10545 6.89455 10 8 10C9.10545 10 10 9.10545 10 8C10 6.89455 9.10545 6 8 6Z" fill="currentColor"/>
                    </svg>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for view buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            viewCommentDetails(commentId);
        });
    });
}

/**
 * View detailed information about a specific comment
 */
function viewCommentDetails(commentId) {
    console.log(`Viewing comment details for comment ID: ${commentId}`);
    
    // In a real implementation, this would fetch the full comment details
    // For now, we'll show a simple alert
    alert(`Viewing detailed information for comment #${commentId}`);
    
    // A real implementation would show a modal with the full comment thread,
    // history, responses, etc.
}

/**
 * Fetch comment data based on the current filters
 */
function fetchCommentData(filters) {
    console.log('Fetching comment data with filters:', filters);
    
    // In a real implementation, this would call the API
    // For now, return sample data after a delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(generateSampleCommentData());
        }, 500);
    });
}

/**
 * Process comment data to extract insights
 */
function processCommentData(comments) {
    // Count sentiment distribution
    const sentimentCounts = {
        Positive: 0,
        Neutral: 0,
        Negative: 0
    };
    
    // Extract all keywords
    const keywordFrequency = {};
    
    // Process comments
    comments.forEach(comment => {
        // Count sentiment
        sentimentCounts[comment.sentiment]++;
        
        // Count keywords
        comment.keywords.forEach(keyword => {
            if (keywordFrequency[keyword]) {
                keywordFrequency[keyword]++;
            } else {
                keywordFrequency[keyword] = 1;
            }
        });
    });
    
    // Sort keywords by frequency
    const sortedKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Get top 10
    
    return {
        sentimentDistribution: {
            labels: Object.keys(sentimentCounts),
            data: Object.values(sentimentCounts)
        },
        topKeywords: {
            labels: sortedKeywords.map(item => item[0]),
            data: sortedKeywords.map(item => item[1])
        },
        comments: comments
    };
}

/**
 * Update comment analysis charts with new data
 */
function updateCommentCharts(data) {
    // Update sentiment chart
    const sentimentChart = Chart.getChart('comment-sentiment-chart');
    if (sentimentChart && data.sentimentDistribution) {
        sentimentChart.data.labels = data.sentimentDistribution.labels;
        sentimentChart.data.datasets[0].data = data.sentimentDistribution.data;
        sentimentChart.update();
    }
    
    // Update keywords chart
    const keywordsChart = Chart.getChart('comment-keywords-chart');
    if (keywordsChart && data.topKeywords) {
        keywordsChart.data.labels = data.topKeywords.labels;
        keywordsChart.data.datasets[0].data = data.topKeywords.data;
        keywordsChart.update();
    }
    
    // Update comment table
    updateCommentTable(data.comments);
}

/**
 * Initialize all charts when analytics page loads
 */
function initAllCharts() {
    // Make sure Chart.js is loaded
    if (window.Chart) {
        // Clear any existing charts to prevent duplicates
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const chartInstance = Chart.getChart(canvas);
            if (chartInstance) {
                chartInstance.destroy();
            }
        });
        
        // Initialize charts for each tab
        initAttendanceCharts();
        initPerformanceCharts();
        initCommentCharts();  // Add this line to initialize comment charts
        initComparisonCharts();
        
        console.log('All charts initialized successfully');
    } else {
        console.error('Chart.js not loaded, cannot initialize charts');
    }
}

// ...existing code...

/**
 * Update dynamic filters based on selected analysis scope
 */
function updateDynamicFilters() {
    const scope = document.getElementById('analysis-scope').value;
    const container = document.getElementById('dynamic-filters-container');
    let filterHTML = '';

    switch (scope) {
        case 'student':
            filterHTML = `
                <label class="filter-label">Select Semester(s)</label>
                <div class="multi-select-container">
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2025-1" checked>
                        <label for="sem-2025-1">2025 Spring</label>
                    </div>
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2024-2">
                        <label for="sem-2024-2">2024 Fall</label>
                    </div>
                    <div class="multi-select-item">
                        <input type="checkbox" id="sem-2024-1">
                        <label for="sem-2024-1">2024 Spring</label>
                    </div>
                </div>`;
            break;

        case 'school':
            filterHTML = `
                <label class="filter-label">Select School</label>
                <select class="filter-select" id="school-filter">
                    <option value="school-1">Seoul International</option>
                    <option value="school-2">Busan Academy</option>
                </select>
                <label class="filter-label">Select Generation</label>
                <select class="filter-select" id="generation-filter">
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                </select>`;
            break;

        case 'class':
            filterHTML = `
                <label class="filter-label">Select Class</label>
                <select class="filter-select" id="class-filter">
                    <option value="math-101">Mathematics 101</option>
                    <option value="science-202">Science 202</option>
                </select>`;
            break;

        default:
            filterHTML = '<p class="filter-label">No additional filters needed</p>';
    }

    container.innerHTML = filterHTML;
}

// Event listener for scope change
document.getElementById('analysis-scope').addEventListener('change', updateDynamicFilters);