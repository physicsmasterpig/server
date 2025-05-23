// Analytics Dashboard JavaScript

// Define the Analytics Module
const AnalyticsModule = {
    data: {
        totalStudents: 0,
        activeStudents: 0,
        attendanceRate: 0,
        avgExamScore: 0,
        homeworkCompletion: 0,
        // Other data props here
    },
    
    /**
     * Initialize the analytics module
     */
    async initialize() {
        // Show loading indicator
        this.showLoadingIndicator();
        
        try {
            // Load dependencies
            await this.loadDependencies();
            
            // Fetch data from API
            await this.fetchAnalyticsData();
            
            // Render overview stats
            await this.renderStatCards();
            
            // Initialize charts
            this.initCharts();
            
            // Set up event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
            this.displayErrorMessage('Failed to load analytics data. Please try again.');
        } finally {
            // Hide loading indicator
            this.hideLoadingIndicator();
        }
    },
    
    /**
     * Load required dependencies
     */
    async loadDependencies() {
        try {
            // Load Chart.js
            await this.loadChartJS();
            
            // Load Component System if not already loaded
            if (!window.ComponentSystem) {
                await this.loadScript('/utils/component-system.js');
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
            throw error;
        }
    },
    
    /**
     * Load a script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
        });
    },
    
    /**
     * Load Chart.js library dynamically
     */
    loadChartJS() {
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                console.log('Chart.js already loaded');
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
            
            script.onload = () => {
                console.log('Chart.js loaded successfully');
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Chart.js'));
            };
            
            document.head.appendChild(script);
        });
    },
    
    /**
     * Fetch analytics data from the server
     */
    async fetchAnalyticsData() {
        try {
            // Simulate API call (replace with actual API call)
            // const response = await fetch('/api/analytics');
            // this.data = await response.json();
            
            // For demo purposes, use mock data
            this.data = {
                totalStudents: 450,
                activeStudents: 432,
                attendanceRate: 78.2,
                avgExamScore: 82.5,
                homeworkCompletion: 93.7,
                // Other data props here
            };
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            throw error;
        }
    },
    
    /**
     * Render the stat cards using the component system
     */
    async renderStatCards() {
        // Ensure the stats container is properly structured
        const statsOverview = document.querySelector('.stats-overview');
        
        // Clear the container and add placeholders for each stat card
        statsOverview.innerHTML = `
            <div id="total-students-container"></div>
            <div id="attendance-rate-container"></div>
            <div id="avg-exam-score-container"></div>
            <div id="homework-completion-container"></div>
        `;
        
        // Total Students Card
        await ComponentSystem.insertComponent(
            '#total-students-container',
            'stat-card',
            {
                label: 'Total Students',
                value: this.data.totalStudents,
                valueId: 'total-students-stat',
                changeClass: '',
                svgPath: 'M8 4L12 8L8 12M4 8L12 8',
                changeText: `${this.data.activeStudents} active`
            }
        );
        
        // Attendance Rate Card
        await ComponentSystem.insertComponent(
            '#attendance-rate-container',
            'stat-card',
            {
                label: 'Attendance Rate',
                value: `${this.data.attendanceRate}%`,
                valueId: 'attendance-rate-stat',
                changeClass: '',
                svgPath: 'M8 12L4 8L8 4M12 8L4 8',
                changeText: '2.4% increase'
            }
        );
        
        // Average Exam Score Card
        await ComponentSystem.insertComponent(
            '#avg-exam-score-container',
            'stat-card',
            {
                label: 'Avg. Exam Score',
                value: `${this.data.avgExamScore}%`,
                valueId: 'avg-exam-score-stat',
                changeClass: 'negative',
                svgPath: 'M8 4L12 8L8 12M4 8L12 8',
                changeText: '1.2% decrease'
            }
        );
        
        // Homework Completion Card
        await ComponentSystem.insertComponent(
            '#homework-completion-container',
            'stat-card',
            {
                label: 'Homework Completion',
                value: `${this.data.homeworkCompletion}%`,
                valueId: 'homework-completion-stat',
                changeClass: '',
                svgPath: 'M8 12L4 8L8 4M12 8L4 8',
                changeText: '3.7% increase'
            }
        );
    },
    
    /**
     * Initialize charts for the analytics module
     */
    initCharts() {
        // Attendance Patterns Chart
        const attendancePatternCtx = document.getElementById('attendance-pattern-chart');
        if (attendancePatternCtx) {
            new Chart(attendancePatternCtx, {
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
        
        // Attendance by Day Chart
        const attendanceByDayCtx = document.getElementById('attendance-by-day-chart');
        if (attendanceByDayCtx) {
            new Chart(attendanceByDayCtx, {
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
        
        // Attendance Distribution Chart
        const attendanceDistributionCtx = document.getElementById('attendance-distribution-chart');
        if (attendanceDistributionCtx) {
            new Chart(attendanceDistributionCtx, {
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
                            labels: { color: '#a3aed0' }
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
    },
    
    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
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
    },
    
    /**
     * Update scope filter options based on selection
     */
    updateScopeFilters() {
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
    },
    
    /**
     * Show lecture sequence specific charts
     */
    showLectureSequenceView() {
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
    },
    
    /**
     * Hide lecture sequence specific charts
     */
    showRegularClassView() {
        const lectureSequenceView = document.getElementById('lecture-sequence-view');
        if (lectureSequenceView) {
            lectureSequenceView.style.display = 'none';
        }
    },
    
    /**
     * Initialize charts for lecture sequence view
     */
    initLectureSequenceCharts() {
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
    },
    
    /**
     * Update charts in the active tab
     * This is needed for proper chart rendering
     */
    updateChartsInActiveTab(tabId) {
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
    },
    
    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        const loadingIndicator = document.getElementById('analytics-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
    },
    
    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('analytics-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    },
    
    /**
     * Display error message
     */
    displayErrorMessage(message) {
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
};

// Initialize the module when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    AnalyticsModule.initialize();
});

// Export the module for use by index.js
window.AnalyticsModule = AnalyticsModule;

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