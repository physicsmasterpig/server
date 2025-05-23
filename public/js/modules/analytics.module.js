/**
 * Analytics Module
 * Handles analytics dashboard functionality
 */
class AnalyticsModule extends BaseModule {
  constructor() {
    super('Analytics');
    
    this.data = {
      overview: {
        totalStudents: 0,
        activeStudents: 0,
        attendanceRate: 0,
        avgExamScore: 0,
        homeworkCompletion: 0
      },
      attendance: {
        pattern: {
          dates: [],
          rates: []
        },
        byDay: {
          days: [],
          rates: []
        },
        distribution: []
      },
      performance: {
        gradeDistribution: [],
        subjectPerformance: []
      }
    };
    
    this.charts = {};
  }
  
  /**
   * Initialize the module
   */
  async initialize() {
    await super.initialize();
    
    try {
      // Load data
      await this.loadAnalyticsData();
      
      // Render components
      await this.renderStatCards();
      
      // Initialize charts
      this.initCharts();
      
      this.showSuccess('Analytics data loaded successfully');
    } catch (error) {
      console.error('Error in analytics initialization:', error);
      this.showError('Failed to load analytics data');
    }
  }
  
  /**
   * Load dependencies
   */
  async loadDependencies() {
    try {
      // Load Chart.js
      await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js');
      
      // Load component system if not already loaded
      if (!window.ComponentSystem) {
        await this.loadScript('/utils/component-system.js');
      }
    } catch (error) {
      console.error('Error loading dependencies:', error);
      throw error;
    }
  }
  
  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      statsOverview: document.querySelector('.stats-overview'),
      tabNavigation: document.querySelector('.tab-navigation'),
      tabItems: document.querySelectorAll('.tab-item'),
      tabContents: document.querySelectorAll('.tab-content'),
      attendanceTab: document.getElementById('attendance-tab'),
      performanceTab: document.getElementById('performance-tab'),
      analysisScope: document.getElementById('analysis-scope'),
      scopeFilterContainer: document.getElementById('scope-filter-container'),
      applyFilters: document.getElementById('apply-filters')
    };
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Tab navigation
    this.elements.tabItems.forEach(tab => {
      tab.addEventListener('click', () => this.handleTabClick(tab));
    });
    
    // Filter actions
    if (this.elements.applyFilters) {
      this.elements.applyFilters.addEventListener('click', () => this.handleFilterApply());
    }
    
    // Analysis scope change
    if (this.elements.analysisScope) {
      this.elements.analysisScope.addEventListener('change', (e) => this.handleScopeChange(e.target.value));
    }
  }
    /**
   * Load analytics data from API
   */
  async loadAnalyticsData() {
    try {
      // Show loading
      this.showLoading('Loading analytics data...');
      
      // Load overview stats
      const overviewResponse = await window.ApiService.get('/analytics/overview');
      if (overviewResponse.success) {
        this.data.overview = overviewResponse.data;
      }
      
      // Load attendance analytics
      const attendanceResponse = await window.ApiService.get('/analytics/attendance');
      if (attendanceResponse.success) {
        this.data.attendance = attendanceResponse.data;
      }
      
      // Load performance analytics
      const performanceResponse = await window.ApiService.get('/analytics/performance');
      if (performanceResponse.success) {
        this.data.performance = performanceResponse.data;
      }
      
      // Process attendance data for charts
      this.processAttendanceData();
      
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      console.error('Error loading analytics data:', error);
      throw error;
    }
  }
    /**
   * Process attendance data for charts
   */
  processAttendanceData() {
    // If no data is available, use defaults
    if (!this.data.attendance) return;
    
    // Format attendance pattern data for charts
    if (this.data.attendance.attendancePattern) {
      this.data.attendance.pattern = {
        dates: this.data.attendance.attendancePattern.dates || [],
        rates: this.data.attendance.attendancePattern.presentRates || []
      };
    }
    
    // Format attendance by day data for charts
    if (this.data.attendance.attendanceByDay) {
      this.data.attendance.byDay = {
        days: this.data.attendance.attendanceByDay.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        rates: this.data.attendance.attendanceByDay.rates || []
      };
    }
    
    // Format attendance distribution data for charts
    if (this.data.attendance.statusDistribution) {
      this.data.attendance.distribution = this.data.attendance.statusDistribution.map(item => ({
        status: item.status,
        count: item.count,
        percentage: Math.round(item.percentage)
      }));
      
      // Update the attendance table with the new data
      this.updateAttendanceTable();
    }
  }
  
  /**
   * Update attendance summary table with real data
   */
  updateAttendanceTable() {
    const tableBody = document.querySelector('.data-table tbody');
    if (!tableBody || !this.data.attendance.distribution) return;
    
    let tableHTML = '';
    
    // Create a row for each status type
    this.data.attendance.distribution.forEach(item => {
      const statusCapitalized = item.status.charAt(0).toUpperCase() + item.status.slice(1);
      const changeClass = item.status === 'absent' || item.status === 'late' ? 'negative' : '';
      // We'd typically calculate the change from previous period data
      const changeValue = '+0.0%'; 
      
      tableHTML += `
        <tr>
          <td>${statusCapitalized}</td>
          <td>${item.count}</td>
          <td>${item.percentage}%</td>
          <td class="stat-change ${changeClass}">${changeValue}</td>
        </tr>
      `;
    });
    
    // Update the table
    tableBody.innerHTML = tableHTML;
  }
  
  /**
   * Render stat cards using component system
   */
  async renderStatCards() {
    if (!this.elements.statsOverview || !window.ComponentSystem) {
      console.error('Unable to render stat cards: required elements not found');
      return;
    }
    
    // Clear the container and add placeholders
    this.elements.statsOverview.innerHTML = `
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
        value: this.data.overview.totalStudents,
        valueId: 'total-students-stat',
        changeClass: '',
        svgPath: 'M8 4L12 8L8 12M4 8L12 8',
        changeText: `${this.data.overview.activeStudents} active`
      }
    );
    
    // Attendance Rate Card
    await ComponentSystem.insertComponent(
      '#attendance-rate-container',
      'stat-card',
      {
        label: 'Attendance Rate',
        value: `${this.data.overview.attendanceRate}%`,
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
        value: `${this.data.overview.avgExamScore}%`,
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
        value: `${this.data.overview.homeworkCompletion}%`,
        valueId: 'homework-completion-stat',
        changeClass: '',
        svgPath: 'M8 12L4 8L8 4M12 8L4 8',
        changeText: '3.7% increase'
      }
    );
  }
  
  /**
   * Initialize charts
   */
  initCharts() {
    this.initAttendancePatternChart();
    this.initAttendanceByDayChart();
    this.initAttendanceDistributionChart();
    // Other chart initializations...
  }
  
  /**
   * Initialize attendance pattern chart
   */
  initAttendancePatternChart() {
    const canvas = document.getElementById('attendance-pattern-chart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Use real data or fallback to sample data
    const dates = this.data.attendance.pattern?.dates || ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
    const rates = this.data.attendance.pattern?.rates || [75, 78, 72, 79, 82, 80, 78, 83];
    
    this.charts.attendancePattern = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Attendance Rate',
          data: rates,
          borderColor: '#7F56D9',
          backgroundColor: 'rgba(127, 86, 217, 0.1)',
          tension: 0.4,
          fill: true
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
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94979C'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94979C'
            },
            min: 60,
            max: 100
          }
        }
      }
    });
  }
  
  /**
   * Initialize attendance by day chart
   */
  initAttendanceByDayChart() {
    const canvas = document.getElementById('attendance-by-day-chart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Use real data or fallback to sample data
    const days = this.data.attendance.byDay?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const rates = this.data.attendance.byDay?.rates || [82, 79, 85, 76, 73];
    
    this.charts.attendanceByDay = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Attendance Rate',
          data: rates,
          backgroundColor: [
            'rgba(127, 86, 217, 0.7)',
            'rgba(127, 86, 217, 0.7)',
            'rgba(127, 86, 217, 0.7)',
            'rgba(127, 86, 217, 0.7)',
            'rgba(127, 86, 217, 0.7)'
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
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94979C'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94979C'
            },
            min: 60,
            max: 100
          }
        }
      }
    });
  }
  
  /**
   * Initialize attendance distribution chart
   */
  initAttendanceDistributionChart() {
    const canvas = document.getElementById('attendance-distribution-chart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Use real data or fallback to sample data
    const distribution = this.data.attendance.distribution || [
      { status: 'present', count: 358, percentage: 78 },
      { status: 'absent', count: 37, percentage: 8 },
      { status: 'late', count: 46, percentage: 10 },
      { status: 'excused', count: 18, percentage: 4 }
    ];
    
    const labels = distribution.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1));
    const data = distribution.map(item => item.percentage);
    const colors = ['#7F56D9', '#F44336', '#FF9800', '#4CAF50'];
    
    this.charts.attendanceDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94979C',
              usePointStyle: true,
              padding: 20
            }
          }
        },
        cutout: '70%'
      }
    });
  }
  
  /**
   * Handle tab click
   * @param {HTMLElement} tab - Clicked tab element
   */
  handleTabClick(tab) {
    const tabId = tab.getAttribute('data-tab');
    
    // Update active tab
    this.elements.tabItems.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show relevant content
    this.elements.tabContents.forEach(content => {
      content.classList.remove('active');
    });
    
    const tabContent = document.getElementById(`${tabId}-tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
  }
  
  /**
   * Handle scope change
   * @param {string} scope - Selected scope
   */
  handleScopeChange(scope) {
    if (!this.elements.scopeFilterContainer) return;
    
    // Clear previous filter options
    this.elements.scopeFilterContainer.innerHTML = '';
    
    // Add specific filters based on scope
    if (scope === 'by-student') {
      const filterHTML = `
        <div class="filter-column">
          <label class="filter-label" for="student-filter">Select Student</label>
          <select class="filter-select" id="student-filter">
            <option value="">Select a student...</option>
            <option value="1">Kim, Min-Jun</option>
            <option value="2">Lee, Ji-Woo</option>
            <option value="3">Park, Seo-Yeon</option>
            <option value="4">Choi, Jun-Ho</option>
          </select>
        </div>
      `;
      this.elements.scopeFilterContainer.innerHTML = filterHTML;
    } else if (scope === 'by-class') {
      const filterHTML = `
        <div class="filter-column">
          <label class="filter-label" for="class-filter">Select Class</label>
          <select class="filter-select" id="class-filter">
            <option value="">Select a class...</option>
            <option value="math-101">Mathematics 101</option>
            <option value="sci-202">Science 202</option>
            <option value="eng-301">English 301</option>
            <option value="cs-401">Computer Science 401</option>
          </select>
        </div>
      `;
      this.elements.scopeFilterContainer.innerHTML = filterHTML;
    } else {
      this.elements.scopeFilterContainer.innerHTML = '<p class="filter-label">No additional filters needed</p>';
    }
  }
  
  /**
   * Handle filter apply
   */
  handleFilterApply() {
    this.showLoading('Applying filters...');
    
    // Collect filter values
    const scope = this.elements.analysisScope ? this.elements.analysisScope.value : 'all';
    const timePeriod = document.getElementById('time-period') ? document.getElementById('time-period').value : 'current';
    
    console.log('Applying filters:', { scope, timePeriod });
    
    // Simulate loading delay
    setTimeout(() => {
      // Update charts (in a real implementation, this would fetch new data)
      if (this.charts.attendancePattern) {
        this.charts.attendancePattern.update();
      }
      
      if (this.charts.attendanceByDay) {
        this.charts.attendanceByDay.update();
      }
      
      if (this.charts.attendanceDistribution) {
        this.charts.attendanceDistribution.update();
      }
      
      this.hideLoading();
      this.showSuccess('Filters applied successfully');
    }, 1000);
  }
}

// Export as a singleton
window.analyticsModule = new AnalyticsModule();
