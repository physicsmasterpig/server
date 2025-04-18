// attendances.js - Improved Attendance Management
(function() {
    // Constants
    const ATTENDANCE_STATUS = {
        PRESENT: 'present',
        LATE: 'late',
        ABSENT: 'absent', 
        VIDEO: 'video',
        EXCUSED: 'excused', 
        NONE: 'N\/A'
    };
    
    const HOMEWORK_CLASSIFICATION = {
        EXCELLENT: 'excellent',
        GOOD: 'good',
        AVERAGE: 'average',
        NEEDS_IMPROVEMENT: 'needs_improvement',
        INCOMPLETE: 'incomplete'
    };

    // API constants for retry logic
    const API_RETRY = API_CONSTANTS.RETRY;
    
    // DOM Element References
    const elements = {
        classSelect: document.getElementById('class-select'),
        lectureSelect: document.getElementById('lecture-select'),
        viewAttendanceBtn: document.getElementById('view-attendance-btn'),
        attendanceContent: document.getElementById('attendance-content'),
        
        // Stats elements
        activeClassesCount: document.getElementById('active-classes-count'),
        totalAttendanceCount: document.getElementById('total-attendance-count'),
        homeworkCompletionRate: document.getElementById('homework-completion-rate'),
        
        // Modal elements
        editAttendanceModal: document.getElementById('edit-attendance-modal'),
        modalClose: document.querySelector('.modal_close'),
        modalClassName: document.getElementById('modal-class-name'),
        modalLectureTopic: document.getElementById('modal-lecture-topic'),
        modalLectureDate: document.getElementById('modal-lecture-date'),
        tabButtons: document.querySelectorAll('.tab_button'),
        tabContents: document.querySelectorAll('.tab_content'),
        attendanceStudentsContainer: document.getElementById('attendance-students-container'),
        homeworkStudentsContainer: document.getElementById('homework-students-container'),
        totalProblemsInput: document.getElementById('total-problems'),
        cancelButton: document.querySelector('.cancel_button'),
        saveButton: document.querySelector('.save_button'),
        
        // Add container IDs for loading indicators
        modalContent: document.getElementById('edit-attendance-modal-content'),
        attendanceTab: document.getElementById('attendance-tab'),
        homeworkTab: document.getElementById('homework-tab')
    };
    
    // State
    let selectedClassId = null;
    let selectedLectureId = null;
    let currentAttendanceData = null;
    let currentHomeworkData = null;
    let classesData = [];
    let lecturesData = [];
    let studentsData = [];
    let enrollmentsData = [];
    let attendanceData = [];
    let homeworkData = [];
    let currentTotalProblems = 10; // Default value for total problems
    
    // Change tracking
    let originalAttendanceData = null;
    let originalHomeworkData = null;
    let hasUnsavedChanges = false;

    // Create maps for efficient lookups
    const attendanceMap = new Map();
    const homeworkMap = new Map();
    const studentMap = new Map();
    const lectureMap = new Map();
    
    // Initialize the page
    async function initPage() {
        try {
            // Show loading indicator on the main content
            UIUtils.showLoading('attendance-content', 'Initializing attendance management...');
            
            await loadInitialData();
            setupEventListeners();
            buildLookupMaps();
            updateStatistics();
            
            console.log("Attendance page initialized successfully.");
        } catch (error) {
            console.error("Error initializing attendance page:", error);
            UIUtils.notify("There was a problem loading the attendance data. Please try refreshing the page.", "error");
        } finally {
            UIUtils.hideLoading('attendance-content');
        }
    }
    
    // Build efficient lookup maps for data
    function buildLookupMaps() {
        // Clear existing maps
        attendanceMap.clear();
        homeworkMap.clear();
        studentMap.clear();
        lectureMap.clear();
        
        // Build attendance map with composite keys
        attendanceData.forEach(att => {
            const key = DataUtils.compositeKey(att.lecture_id, att.student_id);
            attendanceMap.set(key, att);
        });
        
        // Build homework map with composite keys
        homeworkData.forEach(hw => {
            const key = DataUtils.compositeKey(hw.lecture_id, hw.student_id);
            homeworkMap.set(key, hw);
        });
        
        // Build student map
        studentsData.forEach(student => {
            studentMap.set(student.id, student);
        });
        
        // Build lecture map
        lecturesData.forEach(lecture => {
            lectureMap.set(lecture.id, lecture);
        });
    }

    // Load all required data from server
    async function loadInitialData() {
        try {
            await window.appUtils.showLoadingIndicator();
            
            // Load classes data
            const classes = await window.appUtils.loadList('class');
            classesData = classes.map(row => ({
                id: row[0],
                school: row[1],
                year: row[2],
                semester: row[3],
                generation: row[4],
                schedule: row[5],
                status: row[6]
            }));
            
            // Populate class dropdown with active classes
            const activeClasses = classesData.filter(c => c.status === 'active');
            populateClassDropdown(activeClasses);
            
            // Load lectures data (we'll filter by selected class later)
            const lectures = await window.appUtils.loadList('lecture');
            lecturesData = lectures.map(row => ({
                id: row[0],
                class_id: row[1],
                date: row[2],
                time: row[3],
                topic: row[4] || 'Untitled Lecture'
            }));
            
            // Load students data
            const students = await window.appUtils.loadList('student');
            studentsData = students.map(row => ({
                id: row[0],
                name: row[1],
                school: row[2],
                generation: row[3],
                number: row[4],
                enrollment_date: row[5],
                status: row[6]
            }));
            
            // Load enrollments data
            const enrollments = await window.appUtils.loadList('enrollment');
            enrollmentsData = enrollments.map(row => ({
                id: row[0],
                student_id: row[1],
                class_id: row[2],
                enrollment_date: row[3]
            }));
            
            // Load attendance data
            const attendance = await window.appUtils.loadList('attendance');
            attendanceData = attendance.map(row => ({
                id: row[0],
                lecture_id: row[1],
                student_id: row[2],
                status: row[3] || ATTENDANCE_STATUS.NONE
            }));
            
            // Load homework data (if available)
            try {
                const homework = await window.appUtils.loadList('homework');
                homeworkData = homework.map(row => ({
                    id: row[0],
                    lecture_id: row[1],
                    student_id: row[2],
                    total_problems: row[3] ? parseInt(row[3]) : 0,
                    completed_problems: row[4] ? parseInt(row[4]) : 0,
                    classification: row[5] || HOMEWORK_CLASSIFICATION.NONE,
                    comments: row[6] || ''
                }));
            } catch (error) {
                console.error("Error loading homework data:", error);
                homeworkData = [];
            }
            
        } catch (error) {
            console.error("Error loading initial data:", error);
            alert("Failed to load required data. Please refresh the page.");
        } finally {
            await window.appUtils.hideLoadingIndicator();
        }
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Class selection change
        elements.classSelect.addEventListener('change', handleClassChange);
        
        // Lecture selection change
        elements.lectureSelect.addEventListener('change', handleLectureChange);
        
        // View attendance button
        elements.viewAttendanceBtn.addEventListener('click', loadAttendanceData);
        
        // Modal close button
        elements.modalClose.addEventListener('click', () => {
            elements.editAttendanceModal.classList.remove('show');
        });
        
        // Modal tab buttons
        elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Toggle active state
                elements.tabButtons.forEach(btn => btn.classList.remove('active'));
                elements.tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                
                // Show corresponding content
                const tabId = button.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Modal cancel button
        elements.cancelButton.addEventListener('click', () => {
            elements.editAttendanceModal.classList.remove('show');
        });
        
        // Modal save button
        elements.saveButton.addEventListener('click', saveAttendanceAndHomework);
        
        // Total problems input
        elements.totalProblemsInput.addEventListener('change', updateMaxProblemsValues);
        
        // Close modal when clicking outside
        elements.editAttendanceModal.addEventListener('click', (e) => {
            if (e.target === elements.editAttendanceModal) {
                elements.editAttendanceModal.classList.remove('show');
            }
        });

        // Add beforeunload handler for unsaved changes
        window.addEventListener('beforeunload', e => {
            if (hasUnsavedChanges) {
                const message = 'You have unsaved changes that will be lost if you leave the page.';
                e.returnValue = message;
                return message;
            }
        });
        
        // Add change tracking to form inputs
        function trackChanges() {
            hasUnsavedChanges = true;
        }
        
        // Attendance change tracking
        elements.attendanceTab.addEventListener('change', trackChanges);
        
        // Homework change tracking with debounce for text inputs
        const debouncedTrackChanges = UIUtils.debounce(trackChanges);
        elements.homeworkTab.addEventListener('change', trackChanges);
        elements.homeworkTab.addEventListener('input', e => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                debouncedTrackChanges();
            }
        });
    }

    // Populate class dropdown with active classes
    function populateClassDropdown(classes) {
        elements.classSelect.innerHTML = '<option value="">Select Class</option>';
        classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = `${classItem.school} - ${classItem.year}년 ${classItem.semester}학기`;
            elements.classSelect.appendChild(option);
        });
    }

    // Handle class selection change
    function handleClassChange() {
        selectedClassId = elements.classSelect.value;
        
        if (selectedClassId) {
            // Enable lecture selection
            const filteredLectures = lecturesData.filter(lecture => lecture.class_id === selectedClassId);
            populateLectureDropdown(filteredLectures);
            
            // Clear the selected lecture
            selectedLectureId = null;
            elements.lectureSelect.value = "";
            
            // Disable the view button until lecture is selected
            elements.viewAttendanceBtn.setAttribute('disabled', true);
            
            // Show the class overview in the main content area
            renderClassAttendanceOverview(selectedClassId);
        } else {
            // Reset everything if no class is selected
            elements.lectureSelect.innerHTML = '<option value="">Select Lecture</option>';
            elements.lectureSelect.setAttribute('disabled', true);
            elements.viewAttendanceBtn.setAttribute('disabled', true);
            
            // Show empty state
            renderEmptyState();
        }
    }
    
    // Populate lecture dropdown based on selected class
    function populateLectureDropdown(lectures) {
        elements.lectureSelect.removeAttribute('disabled');
        elements.lectureSelect.innerHTML = '<option value="">Select Lecture</option>';
        
        // Sort lectures by date (oldest first)
        const sortedLectures = [...lectures].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        sortedLectures.forEach(lecture => {
            const option = document.createElement('option');
            option.value = lecture.id;
            
            // Format date nicely
            const lectureDate = new Date(lecture.date);
            const formattedDate = lectureDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            option.textContent = `${formattedDate} - ${lecture.topic}`;
            elements.lectureSelect.appendChild(option);
        });
    }

    // Handle lecture selection change
    function handleLectureChange() {
        selectedLectureId = elements.lectureSelect.value;
        
        if (selectedLectureId) {
            elements.viewAttendanceBtn.removeAttribute('disabled');
            
            // Highlight the selected lecture in the attendance overview
            highlightSelectedLecture(selectedLectureId);
        } else {
            elements.viewAttendanceBtn.setAttribute('disabled', true);
            
            // Remove highlight from all lectures
            const lectureRows = document.querySelectorAll('.lecture_row');
            lectureRows.forEach(row => row.classList.remove('selected'));
        }
    }
    
    // Highlight the selected lecture in the overview
    function highlightSelectedLecture(lectureId) {
        const lectureRows = document.querySelectorAll('.lecture_row');
        
        lectureRows.forEach(row => {
            if (row.getAttribute('data-lecture-id') === lectureId) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
    }

    // Render empty state for attendance content
    function renderEmptyState() {
        elements.attendanceContent.innerHTML = `
            <div class="empty_state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6.75H7.75C6.64543 6.75 5.75 7.64543 5.75 8.75V17.25C5.75 18.3546 6.64543 19.25 7.75 19.25H16.25C17.3546 19.25 18.25 18.3546 18.25 17.25V8.75C18.25 7.64543 17.3546 6.75 16.25 6.75H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 8.25H10C9.44772 8.25 9 7.80228 9 7.25V5.75C9 5.19772 9.44772 4.75 10 4.75H14C14.5523 4.75 15 5.19772 15 5.75V7.25C15 7.80228 14.5523 8.25 14 8.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9.75 12.25H14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9.75 15.75H14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h2>No attendance data selected</h2>
                <p>Select a class and lecture above to view attendance records</p>
            </div>
        `;
    }

    // Render class attendance overview in the main content area
    async function renderClassAttendanceOverview(classId) {
        try {
            await window.appUtils.showLoadingIndicator();
            
            const classInfo = classesData.find(c => c.id === classId);
            if (!classInfo) {
                renderEmptyState();
                return;
            }
            
            // Get enrolled students for this class
            const enrolledStudentIds = enrollmentsData
                .filter(e => e.class_id === classId)
                .map(e => e.student_id);
            
            // Get student info for enrolled students
            const enrolledStudents = studentsData
                .filter(s => enrolledStudentIds.includes(s.id) && s.status === 'active')
                .sort((a, b) => a.name.localeCompare(b.name));
            
            // Get lectures for this class
            const classLectures = lecturesData
                .filter(l => l.class_id === classId)
                .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date, oldest first
            
            // Start building the HTML
            let html = `
                <div class="attendance_header">
                    <h1>
                        ${classInfo.school}
                        <span class="class_badge">${classInfo.year}년 ${classInfo.semester}학기 ${classInfo.generation}기</span>
                    </h1>
                    <div class="attendance_actions">
                        <button id="export-attendance-btn" class="action_button">Export Attendance</button>
                    </div>
                </div>
                
                <div class="attendance_overview">
                    <div class="attendance_stats">
                        <div class="stat_item">
                            <span class="stat_label">Total Students</span>
                            <span class="stat_value">${enrolledStudents.length}</span>
                        </div>
                        <div class="stat_item">
                            <span class="stat_label">Total Lectures</span>
                            <span class="stat_value">${classLectures.length}</span>
                        </div>
                        <div class="stat_item">
                            <span class="stat_label">Avg. Attendance</span>
                            <span class="stat_value">${calculateAverageAttendance(classId, classLectures, enrolledStudents)}%</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Add attendance table
            html += `
                <div class="attendance_table_container">
                    <table class="attendance_table">
                        <thead>
                            <tr>
                                <th class="student_col">Student</th>
                                ${classLectures.map(lecture => {
                                    const lectureDate = new Date(lecture.date);
                                    const formattedDate = lectureDate.toLocaleDateString('ko-KR', {
                                        month: 'short',
                                        day: 'numeric'
                                    });
                                    return `<th class="lecture_col" data-lecture-id="${lecture.id}" title="${lecture.topic}">${formattedDate}</th>`;
                                }).join('')}
                                <th class="total_col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add student rows
            for (const student of enrolledStudents) {
                // Calculate attendance counts for this student
                const studentAttendanceCounts = {
                    present: 0,
                    late: 0,
                    absent: 0,
                    video: 0,
                    excused: 0,
                    none: 0,
                    total: classLectures.length
                };
                
                html += `
                    <tr data-student-id="${student.id}">
                        <td class="student_name">${student.name}</td>
                `;
                
                // Add attendance status for each lecture
                for (const lecture of classLectures) {
                    const attendance = attendanceData.find(a => 
                        a.lecture_id === lecture.id && a.student_id === student.id
                    );
                    
                    const status = attendance ? attendance.status : ATTENDANCE_STATUS.NONE;
                    
                    // Update counts
                    if (status === ATTENDANCE_STATUS.PRESENT) {
                        studentAttendanceCounts.present++;
                    } else if (status === ATTENDANCE_STATUS.LATE) {
                        studentAttendanceCounts.late++;
                    } else if (status === ATTENDANCE_STATUS.VIDEO) {
                        studentAttendanceCounts.video++;
                    } else if (status === ATTENDANCE_STATUS.EXCUSED) {
                        studentAttendanceCounts.excused++;
                    } else if (status === ATTENDANCE_STATUS.NONE) {
                        studentAttendanceCounts.none++;
                    }
                     else {
                        studentAttendanceCounts.absent++;
                     }

                    // Add cell with status and homework completion
                    html += `
                    <td class="attendance_cell ${status}" data-lecture-id="${lecture.id}" data-student-id="${student.id}">
                        <div class="attendance_indicators">
                            <div class="status_indicator ${status}"></div>
                            <div class="homework_progress" style="${getHomeworkProgressStyle(student.id, lecture.id)}">
                                <span class="homework_percentage">${getHomeworkPercentage(student.id, lecture.id)}</span>
                            </div>
                        </div>
                    </td>
                    `;
                }
                
                // Calculate attendance rate
                const attendanceRate = classLectures.length > 0 
                    ? Math.round(((studentAttendanceCounts.present + studentAttendanceCounts.late + studentAttendanceCounts.video + studentAttendanceCounts.excused) / (studentAttendanceCounts.total - studentAttendanceCounts.none)) * 100) 
                    : 0;
                
                // Add attendance rate column
                html += `
                        <td class="attendance_rate">
                            <div class="rate_display ${getAttendanceRateClass(attendanceRate)}">
                                ${attendanceRate}%
                            </div>
                        </td>
                    </tr>
                `;
            }
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            // Add lecture details section
            html += `
                <div class="lecture_details_section">
                    <h2>Lecture Details</h2>
                    <div class="lecture_list">
            `;
            
            // Add each lecture with its details
            for (const lecture of classLectures) {
                const lectureDate = new Date(lecture.date);
                const formattedDate = lectureDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // Calculate attendance stats for this lecture
                const lectureStats = calculateLectureStats(lecture.id, enrolledStudents);
                
                html += `
                    <div class="lecture_row ${selectedLectureId === lecture.id ? 'selected' : ''}" data-lecture-id="${lecture.id}">
                        <div class="lecture_info">
                            <div class="lecture_title">${lecture.topic}</div>
                            <div class="lecture_date">${formattedDate} ${lecture.time}</div>
                        </div>
                        <div class="lecture_stats">
                            <div class="lecture_stat">
                                <span class="stat_label">Present</span>
                                <span class="stat_value present">${lectureStats.present}</span>
                            </div>
                            <div class="lecture_stat">
                                <span class="stat_label">Late</span>
                                <span class="stat_value late">${lectureStats.late}</span>
                            </div>
                            <div class="lecture_stat">
                                <span class="stat_label">Absent</span>
                                <span class="stat_value absent">${lectureStats.absent}</span>
                            </div>
                            <div class="lecture_stat">
                                <span class="stat_label">Video</span>
                                <span class="stat_value video">${lectureStats.video}</span>
                            </div>
                            <div class="lecture_stat">
                                <span class="stat_label">Excused</span>
                                <span class="stat_value excused">${lectureStats.excused}</span>
                            </div>
                            <div class="lecture_stat">
                                <span class="stat_label">None</span>
                                <span class="stat_value none">${lectureStats.none}</span>
                            </div>
                        </div>
                        <button class="edit_button" data-lecture-id="${lecture.id}">Edit Attendance</button>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            // Update the attendance content
            elements.attendanceContent.innerHTML = html;
            
            // Add event listeners for the attendance cells and edit buttons
            setupAttendanceTableInteractions();
            
        } catch (error) {
            console.error("Error rendering class attendance:", error);
            renderEmptyState();
        } finally {
            await window.appUtils.hideLoadingIndicator();
        }
    }
    
    // Get homework completion percentage for a student/lecture
    function getHomeworkPercentage(studentId, lectureId) {
        const homework = homeworkData.find(hw => 
            hw.lecture_id === lectureId && hw.student_id === studentId
        );
        
        if (!homework || homework.total_problems === 0) {
            return 'N\/A';
        }
        
        const percentage = Math.round((homework.completed_problems / homework.total_problems) * 100);
        return `${percentage}%`;
    }

    // Generate CSS for the circular progress bar
    function getHomeworkProgressStyle(studentId, lectureId) {
        const homework = homeworkData.find(hw => 
            hw.lecture_id === lectureId && hw.student_id === studentId
        );
        
        if (!homework || homework.total_problems === 0) {
            return '--percentage: 0; --color: #545861;';
        }
        
        const percentage = Math.round((homework.completed_problems / homework.total_problems) * 100);
        let color;
        
        if (percentage >= 90) {
            color = '#17B26A'; // Excellent - green
        } else if (percentage >= 70) {
            color = '#84cc16'; // Good - light green
        } else if (percentage >= 50) {
            color = '#F79009'; // Average - orange
        } else if (percentage >= 30) {
            color = '#fb7185'; // Below average - light red
        } else {
            color = '#F04438'; // Poor - red
        }
        
        return `--percentage: ${percentage}; --color: ${color};`;
    }
    // Setup interactions for the attendance table
    function setupAttendanceTableInteractions() {
        // Add click event for lecture columns to select that lecture
        const lectureColumns = document.querySelectorAll('th.lecture_col');
        lectureColumns.forEach(column => {
            column.addEventListener('click', () => {
                const lectureId = column.getAttribute('data-lecture-id');
                
                // Update dropdown to match
                elements.lectureSelect.value = lectureId;
                
                // Trigger the change event
                const event = new Event('change');
                elements.lectureSelect.dispatchEvent(event);
            });
        });
        
        // Add click event for attendance cells to quick-edit status
        const attendanceCells = document.querySelectorAll('.attendance_cell');
        attendanceCells.forEach(cell => {
            cell.addEventListener('click', () => {
                const lectureId = cell.getAttribute('data-lecture-id');
                const studentId = cell.getAttribute('data-student-id');
                
                // Update selected lecture
                selectedLectureId = lectureId;
                elements.lectureSelect.value = lectureId;
                
                // Highlight the selected lecture
                highlightSelectedLecture(lectureId);
                
                // Load the attendance data and show the modal
                loadAttendanceData(studentId);
            });
        });
        
        // Add click event for edit buttons
        const editButtons = document.querySelectorAll('.edit_button');
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lectureId = button.getAttribute('data-lecture-id');
                
                // Update selected lecture
                selectedLectureId = lectureId;
                elements.lectureSelect.value = lectureId;
                
                // Highlight the selected lecture
                highlightSelectedLecture(lectureId);
                
                // Load the attendance data and show the modal
                loadAttendanceData();
            });
        });
        
        // Add click event for lecture rows to select that lecture
        const lectureRows = document.querySelectorAll('.lecture_row');
        lectureRows.forEach(row => {
            row.addEventListener('click', (e) => {
                // Ignore clicks on the edit button
                if (e.target.classList.contains('edit_button')) {
                    return;
                }
                
                const lectureId = row.getAttribute('data-lecture-id');
                
                // Update selected lecture
                selectedLectureId = lectureId;
                elements.lectureSelect.value = lectureId;
                
                // Highlight the selected lecture
                highlightSelectedLecture(lectureId);
                
                // Enable the view button
                elements.viewAttendanceBtn.removeAttribute('disabled');
            });
        });
    }
    
    // Calculate lecture statistics
    function calculateLectureStats(lectureId, enrolledStudents) {
        const stats = {
            present: 0,
            late: 0,
            absent: 0,
            video: 0,
            excused: 0,
            none: 0,
            total: enrolledStudents.length
        };
        
        // Count attendance for each student
        enrolledStudents.forEach(student => {
            const attendance = attendanceData.find(a => 
                a.lecture_id === lectureId && a.student_id === student.id
            );
            
            if (attendance) {
                if (attendance.status === ATTENDANCE_STATUS.PRESENT) {
                    stats.present++;
                } else if (attendance.status === ATTENDANCE_STATUS.LATE) {
                    stats.late++;
                } else if (attendance.status === ATTENDANCE_STATUS.VIDEO) {
                    stats.video++;
                }
                else if (attendance.status === ATTENDANCE_STATUS.EXCUSED) {
                    stats.excused++;
                } 
                else if (attendance.status === ATTENDANCE_STATUS.NONE) {
                    stats.none++;
                }
                else {
                    stats.absent++;
                }
            } else {
                stats.none++;
            }
        });
        
        return stats;
    }
    
    // Calculate average attendance rate for a class
    function calculateAverageAttendance(classId, lectures, students) {
        if (lectures.length === 0 || students.length === 0) {
            return 0;
        }
        
        let totalPresent = 0;
        let totalLate = 0;
        let totalVideo = 0;
        let totalExcused = 0;
        let totalNone = 0;

        let totalSessions = lectures.length * students.length;
        
        // Count present and late for all students and lectures
        lectures.forEach(lecture => {
            students.forEach(student => {
                const attendance = attendanceData.find(a => 
                    a.lecture_id === lecture.id && a.student_id === student.id
                );
                
                if (attendance) {
                    if (attendance.status === ATTENDANCE_STATUS.PRESENT) {
                        totalPresent++;
                    } else if (attendance.status === ATTENDANCE_STATUS.LATE) {
                        totalLate++;
                    } else if (attendance.status === ATTENDANCE_STATUS.VIDEO) {
                        totalVideo++;
                    } else if (attendance.status === ATTENDANCE_STATUS.EXCUSED) {
                        totalExcused++;
                    } else if (attendance.status === ATTENDANCE_STATUS.NONE) {
                        totalNone++;
                    }
                } else {
                    totalNone++;
                }
            });
        });
        
        // Calculate rate (late counts as 0.5)
        const rate = ((totalPresent + totalLate + totalExcused + totalVideo) / (totalSessions - totalNone)) * 100;
        return Math.round(rate);
    }
    
    // Get CSS class based on attendance rate
    function getAttendanceRateClass(rate) {
        if (rate >= 90) return 'excellent';
        if (rate >= 80) return 'good';
        if (rate >= 70) return 'average';
        if (rate >= 50) return 'warning';
        return 'poor';
    }

    // Load attendance data for selected class and lecture
    async function loadAttendanceData(focusStudentId = null) {
        if (!selectedClassId || !selectedLectureId) {
            UIUtils.notify("Please select a class and a lecture.", "warning");
            return;
        }
        
        try {
            // Show loading indicator
            UIUtils.showLoading('edit-attendance-modal-content', 'Loading attendance data...');
            
            // Get enrolled students for this class
            const enrolledStudentIds = enrollmentsData
                .filter(e => e.class_id === selectedClassId)
                .map(e => e.student_id);
            
            // Filter students who are active
            const activeEnrolledStudents = studentsData
                .filter(s => enrolledStudentIds.includes(s.id) && s.status === 'active')
                .sort((a, b) => a.name.localeCompare(b.name));
            
            // Create attendance data for all enrolled students using the map for faster lookups
            originalAttendanceData = [];
            currentAttendanceData = [];
            
            activeEnrolledStudents.forEach(student => {
                // Find existing attendance record using map
                const key = DataUtils.compositeKey(selectedLectureId, student.id);
                const existingRecord = attendanceMap.get(key);
                
                // Create or use existing record
                const record = existingRecord ? {...existingRecord} : {
                    id: DataUtils.generateUniqueId('AT'),
                    lecture_id: selectedLectureId,
                    student_id: student.id,
                    status: ATTENDANCE_STATUS.NONE // Default to none
                };
                
                // Keep original and current copies to track changes
                originalAttendanceData.push({...record});
                currentAttendanceData.push(record);
            });
            
            // Get homework data using map for faster lookups
            originalHomeworkData = [];
            currentHomeworkData = [];
            
            activeEnrolledStudents.forEach(student => {
                // Find existing homework record using map
                const key = DataUtils.compositeKey(selectedLectureId, student.id);
                const existingHomework = homeworkMap.get(key);
                
                // Create or use existing homework record
                const record = existingHomework ? {...existingHomework} : {
                    id: DataUtils.generateUniqueId('HW'),
                    lecture_id: selectedLectureId,
                    student_id: student.id,
                    total_problems: currentTotalProblems,
                    completed_problems: 0,
                    classification: HOMEWORK_CLASSIFICATION.NONE,
                    comments: ''
                };
                
                // Keep original and current copies to track changes
                originalHomeworkData.push({...record});
                currentHomeworkData.push(record);
            });
            
            // Reset unsaved changes flag
            hasUnsavedChanges = false;
            
            // Populate modal with data
            await populateModalWithAttendanceData(focusStudentId);
            
            // Show modal
            elements.editAttendanceModal.classList.add('show');
            
        } catch (error) {
            console.error("Error loading attendance data:", error);
            UIUtils.notify("Failed to load attendance data. Please try again.", "error");
        } finally {
            UIUtils.hideLoading('edit-attendance-modal-content');
        }
    }
    
    // Populate modal with attendance data
    async function populateModalWithAttendanceData(focusStudentId = null) {
        // Get class and lecture info
        const classInfo = classesData.find(cls => cls.id === selectedClassId);
        const lecture = lecturesData.find(lec => lec.id === selectedLectureId);
        
        if (!classInfo || !lecture) {
            console.error("Missing class or lecture info");
            return;
        }
        
        // Set header info
        elements.modalClassName.textContent = classInfo.school;
        elements.modalLectureTopic.textContent = lecture.topic;
        
        const lectureDate = new Date(lecture.date);
        const formattedDate = lectureDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        elements.modalLectureDate.textContent = formattedDate;
        
        // Clear previous data
        elements.attendanceStudentsContainer.innerHTML = '';
        elements.homeworkStudentsContainer.innerHTML = '';
        
        // Set total problems value
        const maxProblems = Math.max(...currentHomeworkData.map(hw => hw.total_problems || 0), 0);
        currentTotalProblems = maxProblems > 0 ? maxProblems : 10;
        elements.totalProblemsInput.value = currentTotalProblems;
        
        // Populate attendance students
        currentAttendanceData.forEach(att => {
            const student = studentsData.find(st => st.id === att.student_id);
            if (student) {
                const studentRow = document.createElement('div');
                studentRow.className = 'student_row';
                studentRow.dataset.studentId = student.id;
                
                studentRow.innerHTML = `
                    <div class="student_info">
                        <div class="student_name">${student.name}</div>
                    </div>
                    <div class="attendance_options">
                        <div class="attendance_option">
                            <input type="radio" name="attendance-${student.id}" id="present-${student.id}" value="${ATTENDANCE_STATUS.PRESENT}" ${att.status === ATTENDANCE_STATUS.PRESENT ? 'checked' : ''}>
                            <label for="present-${student.id}" class="status_text present">Present</label>
                        </div>
                        <div class="attendance_option">
                            <input type="radio" name="attendance-${student.id}" id="late-${student.id}" value="${ATTENDANCE_STATUS.LATE}" ${att.status === ATTENDANCE_STATUS.LATE ? 'checked' : ''}>
                            <label for="late-${student.id}" class="status_text late">Late</label>
                        </div>
                        <div class="attendance_option">
                            <input type="radio" name="attendance-${student.id}" id="absent-${student.id}" value="${ATTENDANCE_STATUS.ABSENT}" ${att.status === ATTENDANCE_STATUS.ABSENT ? 'checked' : ''}>
                            <label for="absent-${student.id}" class="status_text absent">Absent</label>
                        </div>
                        <div class="attendance_option">
                            <input type="radio" name="attendance-${student.id}" id="video-${student.id}" value="${ATTENDANCE_STATUS.VIDEO}" ${att.status === ATTENDANCE_STATUS.VIDEO ? 'checked' : ''}>
                            <label for="video-${student.id}" class="status_text video">Video</label>
                        </div>
                        <div class="attendance_option">
                            <input type="radio" name="attendance-${student.id}" id="excused-${student.id}" value="${ATTENDANCE_STATUS.EXCUSED}" ${att.status === ATTENDANCE_STATUS.EXCUSED ? 'checked' : ''}>
                            <label for="excused-${student.id}" class="status_text excused">Excused</label>
                        </div>
                        <div class="attendance_option">
                            <input type="radio" name="attendance-${student.id}" id="none-${student.id}" value="${ATTENDANCE_STATUS.NONE}" ${att.status === ATTENDANCE_STATUS.NONE ? 'checked' : ''}>
                            <label for="none-${student.id}" class="status_text none">None</label>
                        </div>
                    </div>
                `;
                
                elements.attendanceStudentsContainer.appendChild(studentRow);
                
                // Attach event listeners to radio buttons
                const radioButtons = studentRow.querySelectorAll('input[type="radio"]');
                radioButtons.forEach(radio => {
                    radio.addEventListener('change', () => {
                        // Update attendance data
                        const status = radio.value;
                        const attIndex = currentAttendanceData.findIndex(a => a.student_id === student.id);
                        if (attIndex !== -1) {
                            currentAttendanceData[attIndex].status = status;
                        }
                    });
                });
            }
        });
        
        // Populate homework students
        currentHomeworkData.forEach(hw => {
            const student = studentsData.find(st => st.id === hw.student_id);
            if (student) {
                const studentRow = document.createElement('div');
                studentRow.className = 'student_row';
                studentRow.dataset.studentId = student.id;
                
                studentRow.innerHTML = `
                    <div class="student_info">
                        <div class="student_name">${student.name}</div>
                    </div>
                    <div class="homework_row">
                        <div class="homework_header">
                            <div class="homework_title">Homework Details</div>
                        </div>
                        <div class="homework_inputs">
                            <div class="input_group">
                                <label>Problems Completed</label>
                                <input type="number" min="0" max="${currentTotalProblems}" value="${hw.completed_problems || 0}" class="completed-problems">
                            </div>
                            <div class="input_group">
                                <label>Classification</label>
                                <select class="homework-classification">
                                    <option value="${HOMEWORK_CLASSIFICATION.EXCELLENT}" ${hw.classification === HOMEWORK_CLASSIFICATION.EXCELLENT ? 'selected' : ''}>Excellent</option>
                                    <option value="${HOMEWORK_CLASSIFICATION.GOOD}" ${hw.classification === HOMEWORK_CLASSIFICATION.GOOD ? 'selected' : ''}>Good</option>
                                    <option value="${HOMEWORK_CLASSIFICATION.AVERAGE}" ${hw.classification === HOMEWORK_CLASSIFICATION.AVERAGE ? 'selected' : ''}>Average</option>
                                    <option value="${HOMEWORK_CLASSIFICATION.NEEDS_IMPROVEMENT}" ${hw.classification === HOMEWORK_CLASSIFICATION.NEEDS_IMPROVEMENT ? 'selected' : ''}>Needs Improvement</option>
                                    <option value="${HOMEWORK_CLASSIFICATION.INCOMPLETE}" ${hw.classification === HOMEWORK_CLASSIFICATION.INCOMPLETE ? 'selected' : ''}>Incomplete</option>
                                </select>
                            </div>
                        </div>
                        <div class="input_group" style="margin-top: 12px;">
                            <label>Comments</label>
                            <textarea rows="2" placeholder="Add comment about this student's homework" class="homework-comments">${hw.comments || ''}</textarea>
                        </div>
                    </div>
                `;
                
                elements.homeworkStudentsContainer.appendChild(studentRow);
                
                // Attach event listeners
                const completedInput = studentRow.querySelector('.completed-problems');
                const classificationSelect = studentRow.querySelector('.homework-classification');
                const commentsTextarea = studentRow.querySelector('.homework-comments');
                
                // Update homework data when values change
                const updateHomework = () => {
                    const hwIndex = currentHomeworkData.findIndex(h => h.student_id === student.id);
                    if (hwIndex !== -1) {
                        currentHomeworkData[hwIndex].completed_problems = parseInt(completedInput.value) || 0;
                        currentHomeworkData[hwIndex].classification = classificationSelect.value;
                        currentHomeworkData[hwIndex].comments = commentsTextarea.value;
                    }
                };
                
                completedInput.addEventListener('change', updateHomework);
                classificationSelect.addEventListener('change', updateHomework);
                commentsTextarea.addEventListener('blur', updateHomework);
            }
        });
        
        // If a specific student is focused, scroll to that student
        if (focusStudentId) {
            // First switch to attendance tab
            document.querySelector('.tab_button[data-tab="attendance"]').click();
            
            // Find the student row
            const studentRow = document.querySelector(`.student_row[data-student-id="${focusStudentId}"]`);
            if (studentRow) {
                setTimeout(() => {
                    studentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    studentRow.classList.add('highlight');
                    
                    // Remove highlight after animation
                    setTimeout(() => {
                        studentRow.classList.remove('highlight');
                    }, 2000);
                }, 300);
            }
        }
    }
    
    // Add data synchronization and real-time change tracking
    async function updateStudentAttendanceUI(studentId, lectureId, status, isProcessing = false) {
        // Update the cell in the main table
        const cell = document.querySelector(`.attendance_cell[data-lecture-id="${lectureId}"][data-student-id="${studentId}"]`);
        
        if (cell) {
            // Remove all status classes
            Object.values(ATTENDANCE_STATUS).forEach(statusClass => {
                cell.classList.remove(statusClass);
            });
            
            // Add the new status class
            cell.classList.add(status);
            
            // Update the status indicator
            const statusIndicator = cell.querySelector('.status_indicator');
            if (statusIndicator) {
                Object.values(ATTENDANCE_STATUS).forEach(statusClass => {
                    statusIndicator.classList.remove(statusClass);
                });
                statusIndicator.classList.add(status);
            }
            
            // Add processing indicator if needed
            if (isProcessing) {
                cell.classList.add('processing');
                
                // Create a processing overlay if it doesn't exist
                if (!cell.querySelector('.processing-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'processing-overlay';
                    overlay.innerHTML = `<div class="mini-spinner"></div>`;
                    
                    // Style the overlay
                    overlay.style.position = 'absolute';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    overlay.style.display = 'flex';
                    overlay.style.alignItems = 'center';
                    overlay.style.justifyContent = 'center';
                    overlay.style.borderRadius = '4px';
                    
                    // Make sure the cell has position relative
                    if (window.getComputedStyle(cell).position === 'static') {
                        cell.style.position = 'relative';
                    }
                    
                    cell.appendChild(overlay);
                }
            } else {
                // Remove processing indicator
                cell.classList.remove('processing');
                const overlay = cell.querySelector('.processing-overlay');
                if (overlay) overlay.remove();
            }
        }
    }
    
    async function updateHomeworkUI(studentId, lectureId, completedProblems, totalProblems, isProcessing = false) {
        // Update the progress indicator in the main table
        const cell = document.querySelector(`.attendance_cell[data-lecture-id="${lectureId}"][data-student-id="${studentId}"]`);
        
        if (cell) {
            const progressEl = cell.querySelector('.homework_progress');
            const percentageEl = cell.querySelector('.homework_percentage');
            
            if (progressEl && percentageEl) {
                const percentage = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;
                
                // Set color based on percentage
                let color;
                if (percentage >= 90) {
                    color = '#17B26A'; // Excellent - green
                } else if (percentage >= 70) {
                    color = '#84cc16'; // Good - light green
                } else if (percentage >= 50) {
                    color = '#F79009'; // Average - orange
                } else if (percentage >= 30) {
                    color = '#fb7185'; // Below average - light red
                } else {
                    color = '#F04438'; // Poor - red
                }
                
                progressEl.style.setProperty('--percentage', percentage);
                progressEl.style.setProperty('--color', color);
                percentageEl.textContent = `${percentage}%`;
                percentageEl.style.color = color;
                
                // Add processing indicator if needed
                if (isProcessing) {
                    progressEl.classList.add('processing');
                    
                    if (!progressEl.querySelector('.mini-processing')) {
                        const processingIndicator = document.createElement('div');
                        processingIndicator.className = 'mini-processing';
                        processingIndicator.style.position = 'absolute';
                        processingIndicator.style.top = '-5px';
                        processingIndicator.style.right = '-5px';
                        processingIndicator.style.width = '8px';
                        processingIndicator.style.height = '8px';
                        processingIndicator.style.borderRadius = '50%';
                        processingIndicator.style.backgroundColor = '#7F56D9';
                        processingIndicator.style.boxShadow = '0 0 5px #7F56D9';
                        processingIndicator.style.animation = 'pulse 1s infinite';
                        
                        progressEl.appendChild(processingIndicator);
                    }
                } else {
                    progressEl.classList.remove('processing');
                    const indicator = progressEl.querySelector('.mini-processing');
                    if (indicator) indicator.remove();
                }
            }
        }
    }
    
    // Enhanced save function with real-time UI updates
    async function saveAttendanceAndHomework() {
        try {
            // Track changes between original and current data
            const attendanceChanges = DataUtils.ChangeTracker.trackChanges(
                originalAttendanceData, 
                currentAttendanceData, 
                'id',
                ['status']
            );
            
            const homeworkChanges = DataUtils.ChangeTracker.trackChanges(
                originalHomeworkData, 
                currentHomeworkData, 
                'id', 
                ['total_problems', 'completed_problems', 'classification', 'comments']
            );
            
            // If no changes, just close the modal
            if (attendanceChanges.modified.length === 0 && 
                attendanceChanges.added.length === 0 && 
                homeworkChanges.modified.length === 0 && 
                homeworkChanges.added.length === 0) {
                
                elements.editAttendanceModal.classList.remove('show');
                UIUtils.notify("No changes detected.", "info");
                return;
            }
            
            // Show loading indicator for the save operation
            UIUtils.showLoading('edit-attendance-modal-content', 'Saving attendance and homework data...');
            
            // Prepare only the changed data to send to the server
            const dataToSend = {
                lecture_id: selectedLectureId,
                attendance_data: [
                    ...attendanceChanges.added,
                    ...attendanceChanges.modified
                ],
                homework_data: [
                    ...homeworkChanges.added,
                    ...homeworkChanges.modified
                ]
            };
            
            console.log('Saving changed data to server:', dataToSend);
            console.log(`Changes: ${attendanceChanges.modified.length} attendance updates, ${attendanceChanges.added.length} new attendance records, ${homeworkChanges.modified.length} homework updates, ${homeworkChanges.added.length} new homework records`);
            
            // Add animations to changes being saved
            [...attendanceChanges.added, ...attendanceChanges.modified].forEach(update => {
                updateStudentAttendanceUI(update.student_id, update.lecture_id, update.status, true);
            });
            
            [...homeworkChanges.added, ...homeworkChanges.modified].forEach(update => {
                updateHomeworkUI(update.student_id, update.lecture_id, update.completed_problems, update.total_problems, true);
            });
            
            // Send the data to the server with retry logic
            const response = await sendRequestWithRetry('/save-attendance-homework', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            }, API_RETRY.MAX_RETRIES, API_RETRY.INITIAL_DELAY, API_RETRY.MAX_DELAY);
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Server response:', result);
            
            // Update local data structures with the records returned from the server
            if (result.attendance && result.attendance.records) {
                result.attendance.records.forEach(update => {
                    const key = DataUtils.compositeKey(update.lecture_id, update.student_id);
                    
                    // Update map
                    attendanceMap.set(key, {...update});
                    
                    // Update array
                    const index = attendanceData.findIndex(a => a.id === update.id);
                    if (index !== -1) {
                        attendanceData[index] = {...update};
                    } else {
                        attendanceData.push({...update});
                    }
                    
                    // Update UI (remove processing indicator)
                    updateStudentAttendanceUI(update.student_id, update.lecture_id, update.status, false);
                });
            }
            
            // Update homework map and data
            if (result.homework && result.homework.records) {
                result.homework.records.forEach(update => {
                    const key = DataUtils.compositeKey(update.lecture_id, update.student_id);
                    
                    // Update map
                    homeworkMap.set(key, {...update});
                    
                    // Update array
                    const index = homeworkData.findIndex(hw => hw.id === update.id);
                    if (index !== -1) {
                        homeworkData[index] = {...update};
                    } else {
                        homeworkData.push({...update});
                    }
                    
                    // Update UI (remove processing indicator)
                    updateHomeworkUI(update.student_id, update.lecture_id, update.completed_problems, update.total_problems, false);
                });
            }
            
            // Reset unsaved changes flag
            hasUnsavedChanges = false;
            
            // Update statistics
            updateStatistics();
            
            // Refresh the class overview to show the updated data
            await renderClassAttendanceOverview(selectedClassId);
            
            // Success notification
            UIUtils.notify("Attendance and homework data saved successfully!", "success");
            
            // Close modal
            elements.editAttendanceModal.classList.remove('show');
            
        } catch (error) {
            console.error("Error saving attendance data:", error);
            UIUtils.notify("Failed to save attendance data. Please try again.\nError: " + error.message, "error");
        } finally {
            UIUtils.hideLoading('edit-attendance-modal-content');
        }
    }
    
    // Helper function to send requests with retry logic
    async function sendRequestWithRetry(url, options, maxRetries, initialDelay, maxDelay) {
        let retries = 0;
        let delay = initialDelay;
        
        while (true) {
            try {
                const response = await fetch(url, options);
                
                // If we got a quota exceeded error from the server
                if (response.status === 429 || (response.status === 500 && await containsQuotaError(response))) {
                    if (retries >= maxRetries) {
                        throw new Error(`Maximum retries (${maxRetries}) exceeded for API quota limits`);
                    }
                    
                    UIUtils.notify(`API quota exceeded. Retrying in ${delay/1000} seconds (attempt ${retries + 1}/${maxRetries})`, "warning");
                    console.log(`API quota exceeded. Retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
                    
                    // Wait for the delay period
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Increase retries and apply exponential backoff with jitter
                    retries++;
                    const jitter = 1 - API_RETRY.JITTER_FACTOR + Math.random() * API_RETRY.JITTER_FACTOR * 2;
                    delay = Math.min(delay * 2 * jitter, maxDelay);
                    continue;
                }
                
                return response;
            } catch (error) {
                if (retries >= maxRetries || !isQuotaError(error)) {
                    throw error;
                }
                
                UIUtils.notify(`API error. Retrying in ${delay/1000} seconds (attempt ${retries + 1}/${maxRetries})`, "warning");
                console.log(`API error. Retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
                
                // Wait for the delay period
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Increase retries and apply exponential backoff with jitter
                retries++;
                const jitter = 1 - API_RETRY.JITTER_FACTOR + Math.random() * API_RETRY.JITTER_FACTOR * 2;
                delay = Math.min(delay * 2 * jitter, maxDelay);
            }
        }
    }
    
    // Check if the error response contains quota exceeded error
    async function containsQuotaError(response) {
        try {
            const clonedResponse = response.clone();
            const json = await clonedResponse.json();
            return json && json.error && (
                json.error.includes('Quota exceeded') ||
                json.error.includes('Rate limit exceeded')
            );
        } catch (e) {
            return false;
        }
    }
    
    // Check if an error object is a quota error
    function isQuotaError(error) {
        return error && error.message && (
            error.message.includes('Quota exceeded') ||
            error.message.includes('Rate limit exceeded') ||
            error.message.includes('User rate limit exceeded')
        );
    }
    
    // Update statistics for the page
    function updateStatistics() {
        // Count active classes
        const activeClassCount = classesData.filter(c => c.status === 'active').length;
        
        // Count total attendance records
        const totalAttendance = attendanceData.length;
        
        // Calculate homework completion rate
        let completedHomework = 0;
        let totalHomework = 0;
        
        homeworkData.forEach(hw => {
            if (hw.total_problems > 0) {
                totalHomework++;
                if (hw.completed_problems >= hw.total_problems) {
                    completedHomework++;
                }
            }
        });
        
        const homeworkRate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;
        
        // Update the UI
        elements.activeClassesCount.textContent = activeClassCount;
        elements.totalAttendanceCount.textContent = totalAttendance;
        elements.homeworkCompletionRate.textContent = homeworkRate + '%';
    }
    
    // Update max problems values when global setting changes
    function updateMaxProblemsValues() {
        const maxProblems = parseInt(elements.totalProblemsInput.value) || 0;
        currentTotalProblems = maxProblems;
        
        // Update all homework inputs
        const inputs = elements.homeworkStudentsContainer.querySelectorAll('.completed-problems');
        inputs.forEach(input => {
            input.setAttribute('max', maxProblems);
        });
        
        // Update all homework records
        currentHomeworkData.forEach(hw => {
            hw.total_problems = maxProblems;
        });
    }
    
    // Generate unique IDs for new records
    function generateAttendanceId() {
        return 'ATT' + Date.now().toString() + Math.floor(Math.random() * 1000);
    }
    
    function generateHomeworkId() {
        return 'HW' + Date.now().toString() + Math.floor(Math.random() * 1000);
    }
    
    // Add CSS for processing indicators
    (function addProcessingStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes mini-spinner {
                to { transform: rotate(360deg); }
            }
            
            .mini-spinner {
                width: 15px;
                height: 15px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: mini-spinner 0.8s linear infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    })();
    
    // Initialize the page
    initPage();
})();