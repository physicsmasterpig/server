// Analytics Dashboard JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the analytics dashboard
    initAnalytics();
});

/**
 * Initialize the analytics dashboard
 */
function initAnalytics() {
    // Setup tab switching
    setupTabs();
    
    // Initialize filter controls
    setupFilterControls();

    // Setup comparison controls
    setupComparisonControls();

    // Load and display sample data
    loadSampleData();

    // Initialize all charts
    initCharts();
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
    console.log('Applying filters:', filters);
    
    // In a real implementation, this would fetch data from the server
    // For now, we'll just simulate a delay and update with sample data
    
    // Show loading indicator
    showLoadingState();
    
    // Simulate server request delay
    setTimeout(() => {
        // Update all charts and stats with new "filtered" data
        loadSampleData(filters);
        updateCharts(filters);
        
        // Hide loading indicator
        hideLoadingState();
    }, 800);
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
 * Load sample data for analytics dashboard
 */
function loadSampleData(filters) {
    // Sample data - in a real app, this would come from an API
    
    // Update summary stats
    updateSummaryStats({
        students: {
            total: 28,
            active: 24,
            newEnrollments: 3
        },
        attendance: {
            rate: 78,
            comparison: 5
        },
        performance: {
            averageScore: 82,
            comparison: 3
        },
        homework: {
            completionRate: 91,
            comparison: 1
        }
    });
    
    // Update attendance table
    updateAttendanceTable([
        {
            name: 'Kim Min-ji',
            class: 'Math 101',
            rate: 65,
            missed: 7,
            pattern: 'Monday absences'
        },
        {
            name: 'Park Ji-hun',
            class: 'Science 202',
            rate: 70,
            missed: 6,
            pattern: 'Random pattern'
        },
        {
            name: 'Lee Seo-yeon',
            class: 'English 101',
            rate: 72,
            missed: 5,
            pattern: 'Afternoon sessions'
        }
    ]);
    
    // Load other sample data for charts
    loadAttendanceSampleData();
    loadPerformanceSampleData();
}

/**
 * Update summary statistics cards
 */
function updateSummaryStats(data) {
    // Update student stats
    document.getElementById('total-students-stat').textContent = data.students.total;
    document.getElementById('active-students').textContent = `${data.students.active} active`;
    document.getElementById('recent-enrollments').textContent = `${data.students.newEnrollments} new`;
    
    // Update attendance stats
    document.getElementById('attendance-rate-stat').textContent = `${data.attendance.rate}%`;
    document.getElementById('attendance-compare').textContent = 
        `${data.attendance.comparison > 0 ? '+' : ''}${data.attendance.comparison}% vs. average`;
    
    // Update performance stats
    document.getElementById('avg-exam-score-stat').textContent = `${data.performance.averageScore}%`;
    document.getElementById('score-compare').textContent = 
        `${data.performance.comparison > 0 ? '+' : ''}${data.performance.comparison}% vs. previous`;
    
    // Update homework completion stats
    document.getElementById('homework-completion-stat').textContent = `${data.homework.completionRate}%`;
    document.getElementById('homework-compare').textContent = 
        `${data.homework.comparison > 0 ? '+' : ''}${data.homework.comparison}% vs. average`;
}

/**
 * Update attendance table with data
 */
function updateAttendanceTable(data) {
    // This would update the table in a real app
    // For this demo, the table is already populated in the HTML
}

/**
 * Load sample data specifically for attendance charts
 */
function loadAttendanceSampleData() {
    // This would populate data for attendance charts
    // The actual chart drawing is done in initCharts()
}

/**
 * Load sample data specifically for performance charts
 */
function loadPerformanceSampleData() {
    // This would populate data for performance charts
    // The actual chart drawing is done in initCharts() 
}

/**
 * Initialize all charts on the dashboard using Chart.js
 */
function initCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        // Load Chart.js if not present
        loadChartJs(() => {
            // Initialize charts after Chart.js loads
            initAttendanceCharts();
            initPerformanceCharts();
            initComparisonCharts();
        });
    } else {
        // Chart.js is already loaded
        initAttendanceCharts();
        initPerformanceCharts();
        initComparisonCharts();
    }
}

/**
 * Load Chart.js library
 */
function loadChartJs(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

/**
 * Initialize attendance tab charts
 */
function initAttendanceCharts() {
    // Define chart options for consistent styling
    const chartOptions = {
        plugins: {
            legend: {
                labels: {
                    color: '#d7e1ee',
                    font: {
                        family: "'Poppins', sans-serif"
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#a3aed0'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#a3aed0'
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    // Attendance Pattern Chart (Line Chart)
    const attendancePatternCtx = document.getElementById('attendance-pattern-chart');
    if (attendancePatternCtx) {
        // Sample data for attendance patterns
        const attendancePatternData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [{
                label: 'Math 101',
                data: [80, 82, 75, 85, 88, 85, 90, 89],
                borderColor: '#725fff',
                backgroundColor: 'rgba(114, 95, 255, 0.1)',
                tension: 0.3
            }, {
                label: 'Science 202',
                data: [78, 75, 72, 76, 80, 75, 78, 82],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.3
            }]
        };
        
        new Chart(attendancePatternCtx, {
            type: 'line',
            data: attendancePatternData,
            options: chartOptions
        });
    }
    
    // Attendance By Day Chart (Bar Chart)
    const attendanceByDayCtx = document.getElementById('attendance-by-day-chart');
    if (attendanceByDayCtx) {
        // Sample data for attendance by day
        const attendanceByDayData = {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            datasets: [{
                label: 'Attendance Rate',
                data: [75, 82, 88, 80, 72],
                backgroundColor: [
                    'rgba(114, 95, 255, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 159, 67, 0.7)',
                    'rgba(233, 30, 99, 0.7)'
                ]
            }]
        };
        
        new Chart(attendanceByDayCtx, {
            type: 'bar',
            data: attendanceByDayData,
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Attendance Distribution Chart (Doughnut Chart)
    const attendanceDistributionCtx = document.getElementById('attendance-distribution-chart');
    if (attendanceDistributionCtx) {
        // Sample data for attendance distribution
        const attendanceDistributionData = {
            labels: ['90-100%', '80-89%', '70-79%', '60-69%', '<60%'],
            datasets: [{
                data: [6, 8, 7, 4, 3],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',  // Green
                    'rgba(33, 150, 243, 0.8)', // Blue
                    'rgba(255, 235, 59, 0.8)', // Yellow
                    'rgba(255, 159, 67, 0.8)', // Orange
                    'rgba(244, 67, 54, 0.8)'   // Red
                ],
                borderWidth: 1
            }]
        };
        
        new Chart(attendanceDistributionCtx, {
            type: 'doughnut',
            data: attendanceDistributionData,
            options: {
                ...chartOptions,
                cutout: '65%',
                plugins: {
                    ...chartOptions.plugins,
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

/**
 * Initialize performance tab charts
 */
function initPerformanceCharts() {
    // Chart styling options
    const chartOptions = {
        plugins: {
            legend: {
                labels: {
                    color: '#d7e1ee',
                    font: {
                        family: "'Poppins', sans-serif"
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#a3aed0'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#a3aed0'
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    };
    
    // Grade Distribution Chart
    const gradeDistributionCtx = document.getElementById('grade-distribution-chart');
    if (gradeDistributionCtx) {
        const gradeDistributionData = {
            labels: ['A', 'B', 'C', 'D', 'F'],
            datasets: [{
                label: 'Number of Students',
                data: [8, 10, 6, 3, 1],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',  // Green
                    'rgba(33, 150, 243, 0.8)', // Blue
                    'rgba(255, 235, 59, 0.8)', // Yellow
                    'rgba(255, 159, 67, 0.8)', // Orange
                    'rgba(244, 67, 54, 0.8)'   // Red
                ],
                borderWidth: 0
            }]
        };
        
        new Chart(gradeDistributionCtx, {
            type: 'bar',
            data: gradeDistributionData,
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Subject Performance Chart
    const subjectPerformanceCtx = document.getElementById('subject-performance-chart');
    if (subjectPerformanceCtx) {
        const subjectPerformanceData = {
            labels: ['Mathematics', 'Science', 'English', 'Social Studies', 'Arts'],
            datasets: [{
                label: 'Average Score (%)',
                data: [82, 78, 85, 76, 90],
                backgroundColor: 'rgba(114, 95, 255, 0.7)',
                borderColor: '#725fff',
                borderWidth: 1
            }]
        };
        
        new Chart(subjectPerformanceCtx, {
            type: 'radar',
            data: subjectPerformanceData,
            options: {
                ...chartOptions,
                scales: {},
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }
    
    // Performance vs Attendance Chart
    const performanceAttendanceCtx = document.getElementById('performance-attendance-chart');
    if (performanceAttendanceCtx) {
        const performanceAttendanceData = {
            datasets: [{
                label: 'Students',
                data: [
                    { x: 95, y: 91 },
                    { x: 88, y: 85 },
                    { x: 75, y: 72 },
                    { x: 92, y: 88 },
                    { x: 65, y: 60 },
                    { x: 78, y: 75 },
                    { x: 85, y: 82 },
                    { x: 70, y: 65 },
                    { x: 60, y: 55 },
                    { x: 98, y: 95 },
                    { x: 82, y: 78 },
                    { x: 90, y: 88 },
                    { x: 72, y: 68 },
                    { x: 75, y: 70 },
                    { x: 80, y: 76 }
                ],
                backgroundColor: 'rgba(114, 95, 255, 0.7)',
                borderColor: '#725fff'
            }]
        };
        
        new Chart(performanceAttendanceCtx, {
            type: 'scatter',
            data: performanceAttendanceData,
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Attendance: ${context.parsed.x}%, Performance: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ...chartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Attendance Rate (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100
                    },
                    y: {
                        ...chartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Performance Score (%)',
                            color: '#a3aed0'
                        },
                        min: 50,
                        max: 100
                    }
                }
            }
        });
    }
}

/**
 * Initialize comparison tab charts
 */
function initComparisonCharts() {
    // Chart styling options
    const chartOptions = {
        plugins: {
            legend: {
                labels: {
                    color: '#d7e1ee',
                    font: {
                        family: "'Poppins', sans-serif"
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#a3aed0'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: '#a3aed0'
                },
                beginAtZero: true
            }
        },
        responsive: true,
        maintainAspectRatio: false
    };
    
    // Comparison Chart
    const comparisonChartCtx = document.getElementById('comparison-chart');
    if (comparisonChartCtx) {
        // Default sample data for comparison chart
        const comparisonData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [
                {
                    label: 'Mathematics 101',
                    data: [80, 82, 75, 85, 88, 85, 90, 89],
                    borderColor: '#725fff',
                    backgroundColor: 'rgba(114, 95, 255, 0.1)',
                    tension: 0.3
                }, 
                {
                    label: 'Science 202',
                    data: [78, 75, 72, 76, 80, 75, 78, 82],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.3
                }
            ]
        };
        
        new Chart(comparisonChartCtx, {
            type: 'line',
            data: comparisonData,
            options: chartOptions
        });
    }
    
    // Correlation Chart
    const correlationChartCtx = document.getElementById('correlation-chart');
    if (correlationChartCtx) {
        const correlationData = {
            labels: ['Attendance', 'Homework', 'Practice Tests', 'Study Hours', 'Group Work'],
            datasets: [
                {
                    label: 'Correlation with Exam Scores',
                    data: [0.82, 0.75, 0.90, 0.85, 0.65],
                    backgroundColor: 'rgba(114, 95, 255, 0.7)',
                    borderColor: '#725fff',
                    borderWidth: 1
                }
            ]
        };
        
        new Chart(correlationChartCtx, {
            type: 'bar',
            data: correlationData,
            options: {
                ...chartOptions,
                scales: {
                    ...chartOptions.scales,
                    y: {
                        ...chartOptions.scales.y,
                        max: 1
                    }
                },
                plugins: {
                    ...chartOptions.plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Correlation: ${context.parsed.y}`;
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