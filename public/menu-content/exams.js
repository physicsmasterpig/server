// exams.js - Comprehensive exam management
(function() {
    // Constants
    const ROWS_PER_PAGE = 10;
    const EXAM_STATUS = {
        ACTIVE: 'active',
        PENDING: 'pending',
        COMPLETED: 'completed'
    };
    
    // DOM Element References
    const elements = {
        // Table and stats elements
        activeExamsCount: document.getElementById('active-exams-count'),
        totalExamsCount: document.getElementById('total-exams-count'),
        averageScore: document.getElementById('average-score'),
        searchBox: document.querySelector('.searchbox input'),
        tableBody: document.querySelector('.table_content tbody'),
        pageInfo: document.querySelector('.range_info'),
        prevButton: document.getElementById('previous_button'),
        nextButton: document.getElementById('next_button'),
        
        // Create Exam Modal
        createExamBtn: document.getElementById('create-exam-btn'),
        createExamModal: document.getElementById('create-exam-modal'),
        closeCreateModalBtn: document.getElementById('close-create-modal-btn'),
        examTitle: document.getElementById('exam-title'),
        examDate: document.getElementById('exam-date'),
        examClass: document.getElementById('exam-class'),
        examStatus: document.getElementById('exam-status'),
        examDescription: document.getElementById('exam-description'),
        problemsContainer: document.getElementById('problems-container'),
        addMoreProblemsBtn: document.getElementById('add-more-problems'),
        submitExamBtn: document.getElementById('submit-exam-btn'),
        
        // Manage Scores Modal
        manageScoresModal: document.getElementById('manage-scores-modal'),
        scoreExamTitle: document.getElementById('score-exam-title'),
        scoreExamClass: document.getElementById('score-exam-class'),
        scoreExamDate: document.getElementById('score-exam-date'),
        scoreExamTotal: document.getElementById('score-exam-total'),
        scoreExamStatus: document.getElementById('score-exam-status'),
        scoreExamAverage: document.getElementById('score-exam-average'),
        examProblemsList: document.getElementById('exam-problems-list'),
        scoreSummaryBody: document.getElementById('score-summary-body'),
        closeViewModalBtn: document.getElementById('close-view-modal-btn'),
        editExamBtn: document.getElementById('edit-exam-btn'),
        
        // View Exam Details Modal
        viewExamModal: document.getElementById('view-exam-modal'),
        detailExamTitle: document.getElementById('detail-exam-title'),
        detailExamClass: document.getElementById('detail-exam-class'),
        detailExamDate: document.getElementById('detail-exam-date'),
        detailExamTotal: document.getElementById('detail-exam-total'),
        detailExamStatus: document.getElementById('detail-exam-status'),
        detailExamDescription: document.getElementById('detail-exam-description'),
        detailProblemsList: document.getElementById('detail-problems-list'),
        studentScoresBody: document.getElementById('student-scores-body'),
        saveScoresBtn: document.getElementById('save-scores-btn'),
        closeScoresModalBtn: document.getElementById('close-scores-modal-btn')
    };
    
    // State
    let examsData = [];
    let classesData = [];
    let studentsData = [];
    let problemsData = [];
    let scoresData = [];
    let examProblemsData = [];
    let problemCount = 1;
    let selectedExamId = null;
    let currentPage = 1;
    let totalPages = 1;
    let filteredExams = [];
    
    // Initialize the page
    async function initPage() {
        try {
            // Show loading indicator
            if (window.appUtils && window.appUtils.showLoadingIndicator) {
                window.appUtils.showLoadingIndicator();
            }
            
            await loadInitialData();
            setupEventListeners();
            renderExamsTable();
            populateClassDropdown();
            setDefaultDate();
            updateStatistics();
            
            console.log("Exams page initialized successfully.");
        } catch (error) {
            console.error("Error initializing exams page:", error);
            alert("There was a problem loading the exams data. Please try refreshing the page.");
        } finally {
            // Hide loading indicator when everything is done
            if (window.appUtils && window.appUtils.hideLoadingIndicator) {
                window.appUtils.hideLoadingIndicator();
            }
        }
    }
    
    // Load all required data from server
    async function loadInitialData() {
        try {
            // Load all data in parallel for better performance
            const [exams, classes, students, problems, examProblems, scores] = await Promise.all([
                window.appUtils.loadList('exam'),
                window.appUtils.loadList('class'),
                window.appUtils.loadList('student'),
                window.appUtils.loadList('problem'),
                window.appUtils.loadList('exam_problem'),
                window.appUtils.loadList('score').catch(() => [])
            ]);
            
            // Process exam data
            examsData = exams.map(row => ({
                id: row[0],
                title: row[1] || 'Untitled Exam',
                description: row[2] || ''
            }));
            
            // Process class data
            classesData = classes.map(row => ({
                id: row[0],
                school: row[1],
                year: row[2],
                semester: row[3],
                generation: row[4],
                schedule: row[5],
                status: row[6]
            }));
            
            // Process student data
            studentsData = students.map(row => ({
                id: row[0],
                name: row[1],
                school: row[2],
                generation: row[3],
                number: row[4],
                enrollment_date: row[5],
                status: row[6]
            }));
            
            // Process problem data
            problemsData = problems.map(row => ({
                id: row[0],
                title: row[1] || 'Untitled Problem',
                description: row[2] || ''
            }));
            
            // Process exam-problem relationships
            examProblemsData = examProblems.map(row => ({
                id: row[0],
                exam_id: row[1],
                problem_id: row[2],
                max_score: parseInt(row[3]) || 0,
                problem_number: parseInt(row[4]) || 0,
                date: row[5] || '',
                class_id: row[6] || '',
                status: row[7] || EXAM_STATUS.PENDING
            }));
            
            // Process score data
            scoresData = scores.map(row => ({
                id: row[0],
                exam_id: row[1],
                student_id: row[2],
                problem_id: row[3],
                score: parseInt(row[4]) || 0,
                comment: row[5] || '',
                date: row[6] || '',
                status: row[7] || '',
                last_updated: row[8] || ''
            }));
            
            // Sort exams by date (most recent first)
            examsData.sort((a, b) => {
                const aDate = getExamDate(a.id) || '';
                const bDate = getExamDate(b.id) || '';
                return new Date(bDate) - new Date(aDate);
            });
            
        } catch (error) {
            console.error("Error loading initial data:", error);
            throw error;
        }
    }
    
    // Helper function to get an exam's date from exam_problems
    function getExamDate(examId) {
        const examProblem = examProblemsData.find(ep => ep.exam_id === examId);
        return examProblem ? examProblem.date : null;
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Search box filter
        elements.searchBox.addEventListener('input', () => {
            currentPage = 1; // Reset to first page when searching
            filterExamsTable();
        });
        
        // Create exam button
        elements.createExamBtn.addEventListener('click', () => {
            elements.createExamModal.classList.add('show');
        });
        
        // Close create exam modal
        elements.closeCreateModalBtn.addEventListener('click', () => {
            elements.createExamModal.classList.remove('show');
        });
        
        // Add more problems button
        elements.addMoreProblemsBtn.addEventListener('click', addProblemEntry);
        
        // Submit exam button
        elements.submitExamBtn.addEventListener('click', handleExamSubmit);
        
        // Close manage scores modal
        elements.closeViewModalBtn.addEventListener('click', () => {
            elements.manageScoresModal.classList.remove('show');
        });
        
        // Edit exam button (transition from manage to view details)
        elements.editExamBtn.addEventListener('click', () => {
            elements.manageScoresModal.classList.remove('show');
            elements.viewExamModal.classList.add('show');
        });
        
        // Close view exam details modal
        elements.closeScoresModalBtn.addEventListener('click', () => {
            elements.viewExamModal.classList.remove('show');
        });
        
        // Save scores button
        elements.saveScoresBtn.addEventListener('click', saveExamScores);
        
        // Pagination buttons
        elements.prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderExamTablePage();
            }
        });
        
        elements.nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderExamTablePage();
            }
        });
        
        // Modal outside click to close
        elements.createExamModal.addEventListener('click', (e) => {
            if (e.target === elements.createExamModal) {
                elements.createExamModal.classList.remove('show');
            }
        });
        
        elements.manageScoresModal.addEventListener('click', (e) => {
            if (e.target === elements.manageScoresModal) {
                elements.manageScoresModal.classList.remove('show');
            }
        });
        
        elements.viewExamModal.addEventListener('click', (e) => {
            if (e.target === elements.viewExamModal) {
                elements.viewExamModal.classList.remove('show');
            }
        });
        
        // Initial problem entry remove button
        const initialRemoveBtn = document.querySelector('.problem-entry .remove-problem');
        if (initialRemoveBtn) {
            initialRemoveBtn.addEventListener('click', function() {
                const problemEntry = this.closest('.problem-entry');
                if (document.querySelectorAll('.problem-entry').length > 1) {
                    problemEntry.remove();
                    reindexProblemEntries();
                } else {
                    alert('At least one problem is required for an exam.');
                }
            });
        }
    }
    
    // Set today's date as default for date fields
    function setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (elements.examDate) {
            elements.examDate.value = formattedDate;
        }
    }
    
    // Populate class dropdown with active classes
    function populateClassDropdown() {
        if (!elements.examClass) return;
        
        elements.examClass.innerHTML = '<option value="" disabled selected>Select a class</option>';
        
        const activeClasses = classesData.filter(c => c.status === 'active');
        
        activeClasses.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = `${classItem.school} - ${classItem.year}년 ${classItem.semester}학기`;
            elements.examClass.appendChild(option);
        });
    }
    
    // Filter exams table based on search input
    function filterExamsTable() {
        const query = elements.searchBox.value.toLowerCase();
        
        // Generate detailed exam info for each exam
        filteredExams = examsData.map(exam => {
            return getDetailedExamInfo(exam);
        }).filter(exam => {
            return exam.title.toLowerCase().includes(query) || 
                  exam.class.toLowerCase().includes(query) ||
                  exam.status.toLowerCase().includes(query);
        });
        
        // Calculate total pages
        totalPages = Math.max(1, Math.ceil(filteredExams.length / ROWS_PER_PAGE));
        
        // Ensure current page is in valid range
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        
        renderExamTablePage();
    }
    
    // Get detailed information for an exam
    function getDetailedExamInfo(exam) {
        const examProblems = examProblemsData.filter(ep => ep.exam_id === exam.id);
        const totalProblems = examProblems.length;
        const totalScore = examProblems.reduce((sum, ep) => sum + ep.max_score, 0);
        
        // Get class info
        const classId = examProblems.length > 0 ? examProblems[0].class_id : null;
        const classInfo = classId ? classesData.find(c => c.id === classId) : null;
        
        // Get date and status
        const date = examProblems.length > 0 ? examProblems[0].date || 'Not scheduled' : 'Not scheduled';
        const status = examProblems.length > 0 ? examProblems[0].status || EXAM_STATUS.PENDING : EXAM_STATUS.PENDING;
        
        return {
            ...exam,
            totalProblems,
            totalScore,
            class: classInfo ? `${classInfo.school} - ${classInfo.year}년 ${classInfo.semester}학기` : 'Unknown class',
            classId: classId,
            status,
            date,
            formattedDate: formatDate(date)
        };
    }
    
    // Helper function to format dates
    function formatDate(dateStr) {
        if (!dateStr || dateStr === 'Not scheduled') return 'Not scheduled';
        
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }
    
    // Render exams table with data
    function renderExamsTable() {
        // Apply filters
        filterExamsTable();
    }
    
    // Render a specific page of the exams table
    function renderExamTablePage() {
        if (!elements.tableBody) return;
        
        elements.tableBody.innerHTML = '';
        
        // Calculate page bounds
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, filteredExams.length);
        
        // Show current page exams
        for (let i = startIndex; i < endIndex; i++) {
            const exam = filteredExams[i];
            const tr = document.createElement('tr');
            
            // Create table cells
            tr.innerHTML = `
                <td>${exam.id}</td>
                <td>${exam.title}</td>
                <td>${exam.class}</td>
                <td>${exam.formattedDate}</td>
                <td>${exam.totalProblems}</td>
                <td>${exam.totalScore}</td>
                <td><span class="status-badge status-${exam.status}">${capitalize(exam.status)}</span></td>
                <td><img src="/assets/details-view.svg" alt="View" class="details-svg action-svg"></td>
                <td><img src="/assets/manage-view.svg" alt="Manage" class="manage-svg action-svg"></td>
            `;
            
            // Add event listeners for the action buttons
            const detailsBtn = tr.querySelector('.details-svg');
            detailsBtn.addEventListener('click', () => handleExamDetailView(exam.id));
            
            const manageBtn = tr.querySelector('.manage-svg');
            manageBtn.addEventListener('click', () => handleManageScores(exam.id));
            
            elements.tableBody.appendChild(tr);
        }
        
        // Update pagination info
        updatePaginationInfo();
    }
    
    // Update pagination info and button states
    function updatePaginationInfo() {
        // Update page info text
        elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        // Update button states
        elements.prevButton.disabled = currentPage <= 1;
        elements.nextButton.disabled = currentPage >= totalPages;
    }
    
    // Add a new problem entry to the create exam form
    function addProblemEntry() {
        problemCount++;
        
        const newEntry = document.createElement('div');
        newEntry.className = 'problem-entry';
        newEntry.dataset.problemIndex = problemCount - 1;
        
        newEntry.innerHTML = `
            <div class="problem-entry-header">
                <span class="problem-number">Problem ${problemCount}</span>
                <span class="remove-problem">Remove</span>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Problem Title</label>
                    <input type="text" class="form-input problem-title" placeholder="Problem title">
                </div>
                <div class="form-group">
                    <label class="form-label">Max Score</label>
                    <input type="number" class="form-input problem-score" placeholder="Points" min="1" value="10">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Problem Description</label>
                <textarea class="form-input problem-description" rows="2" placeholder="Description of the problem"></textarea>
            </div>
        `;
        
        elements.problemsContainer.appendChild(newEntry);
        
        // Add event listener to the remove button
        const removeBtn = newEntry.querySelector('.remove-problem');
        removeBtn.addEventListener('click', function() {
            const problemEntry = this.closest('.problem-entry');
            problemEntry.remove();
            reindexProblemEntries();
        });
    }
    
    // Reindex problem entries after removal
    function reindexProblemEntries() {
        const entries = elements.problemsContainer.querySelectorAll('.problem-entry');
        
        entries.forEach((entry, index) => {
            entry.dataset.problemIndex = index;
            const numberSpan = entry.querySelector('.problem-number');
            numberSpan.textContent = `Problem ${index + 1}`;
        });
        
        problemCount = entries.length;
    }
    
    // Handle exam form submission
    async function handleExamSubmit() {
        try {
            // Get form values
            const title = elements.examTitle.value.trim();
            const date = elements.examDate.value;
            const classId = elements.examClass.value;
            const status = elements.examStatus.value;
            const description = elements.examDescription.value.trim();
            
            // Validate required fields
            if (!title || !date || !classId) {
                alert('Please fill in all required fields: Title, Date, and Class.');
                return;
            }
            
            // Collect problems data
            const problemEntries = elements.problemsContainer.querySelectorAll('.problem-entry');
            const problems = [];
            
            let isValid = true;
            problemEntries.forEach((entry, index) => {
                const title = entry.querySelector('.problem-title').value.trim();
                const score = parseInt(entry.querySelector('.problem-score').value);
                const description = entry.querySelector('.problem-description').value.trim();
                
                if (!title || isNaN(score) || score <= 0) {
                    isValid = false;
                    return;
                }
                
                problems.push({
                    title,
                    score,
                    description,
                    problem_number: index + 1
                });
            });
            
            if (!isValid || problems.length === 0) {
                alert('Please complete all problem information. Each problem must have a title and valid score.');
                return;
            }
            
            // Prepare exam data
            const examId = generateExamId();
            const examData = {
                exam_id: examId,
                title,
                date,
                class_id: classId,
                status,
                description,
                problems: problems.map(problem => ({
                    problem_id: generateProblemId(),
                    title: problem.title,
                    description: problem.description,
                    max_score: problem.score,
                    problem_number: problem.problem_number
                }))
            };
            
            // Show loading indicator
            await window.appUtils.showLoadingIndicator();
            
            console.log('Submitting exam data:', examData);
            
            // Send to server
            const response = await fetch('/add-exam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(examData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create exam');
            }
            
            // Process successful response
            const result = await response.json();
            
            if (result.success) {
                // Add new exam to local data
                examsData.push({
                    id: examData.exam_id,
                    title: examData.title,
                    description: examData.description
                });
                
                // Add problems
                examData.problems.forEach(problem => {
                    problemsData.push({
                        id: problem.problem_id,
                        title: problem.title,
                        description: problem.description
                    });
                    
                    examProblemsData.push({
                        id: `EP${Date.now()}${Math.floor(Math.random() * 1000)}`,
                        exam_id: examData.exam_id,
                        problem_id: problem.problem_id,
                        max_score: problem.max_score,
                        problem_number: problem.problem_number,
                        date: examData.date,
                        class_id: examData.class_id,
                        status: examData.status
                    });
                });
                
                // Re-render the table
                renderExamsTable();
                updateStatistics();
                
                // Close modal and reset form
                elements.createExamModal.classList.remove('show');
                resetExamForm();
                
                alert('Exam created successfully!');
            } else {
                throw new Error('Server returned success: false');
            }
            
        } catch (error) {
            console.error('Error submitting exam:', error);
            alert(`Failed to create exam: ${error.message}`);
        } finally {
            await window.appUtils.hideLoadingIndicator();
        }
    }
    
    // Reset the exam creation form
    function resetExamForm() {
        elements.examTitle.value = '';
        setDefaultDate();
        elements.examClass.value = '';
        elements.examStatus.value = EXAM_STATUS.PENDING;
        elements.examDescription.value = '';
        
        // Reset problems (keep only the first one)
        const problemEntries = elements.problemsContainer.querySelectorAll('.problem-entry');
        
        // Remove all but the first problem
        for (let i = 1; i < problemEntries.length; i++) {
            problemEntries[i].remove();
        }
        
        // Reset first problem
        if (problemEntries[0]) {
            problemEntries[0].querySelector('.problem-title').value = '';
            problemEntries[0].querySelector('.problem-score').value = 10;
            problemEntries[0].querySelector('.problem-description').value = '';
        }
        
        // Reset problem count
        problemCount = 1;
    }
    
    // Handle click on exam row for details view
    function handleExamDetailView(examId) {
        selectedExamId = examId;
        
        // Get exam details
        const exam = getExamDetails(examId);
        if (!exam) {
            alert('Exam not found.');
            return;
        }
        
        // Populate the details modal
        populateExamDetailsModal(exam);
        
        // Show the details modal
        elements.manageScoresModal.classList.add('show');
    }
    
    // Handle click on manage scores button
    function handleManageScores(examId) {
        selectedExamId = examId;
        
        // Get exam details
        const exam = getExamDetails(examId);
        if (!exam) {
            alert('Exam not found.');
            return;
        }
        
        // Populate the view exam modal with scores
        populateExamScoresModal(exam);
        
        // Show the view exam modal
        elements.viewExamModal.classList.add('show');
    }
    
    // Get exam details including related problems and scores
    function getExamDetails(examId) {
        const exam = examsData.find(e => e.id === examId);
        if (!exam) return null;
        
        const examProblems = examProblemsData.filter(ep => ep.exam_id === examId)
            .sort((a, b) => a.problem_number - b.problem_number);
        
        const problems = examProblems.map(ep => {
            const problem = problemsData.find(p => p.id === ep.problem_id);
            return {
                id: ep.problem_id,
                title: problem ? problem.title : 'Unknown Problem',
                description: problem ? problem.description : '',
                max_score: ep.max_score,
                problem_number: ep.problem_number
            };
        });
        
        // Get class info for this exam
        const firstExamProblem = examProblems[0];
        const classId = firstExamProblem ? firstExamProblem.class_id : null;
        const classInfo = classId ? classesData.find(c => c.id === classId) : null;
        const className = classInfo ? `${classInfo.school} - ${classInfo.year}년 ${classInfo.semester}학기` : 'Unknown class';
        
        // Get date and status
        const date = firstExamProblem ? firstExamProblem.date || 'Not scheduled' : 'Not scheduled';
        const status = firstExamProblem ? firstExamProblem.status || EXAM_STATUS.PENDING : EXAM_STATUS.PENDING;
        
        // Get enrolled students for this class
        const enrolledStudentIds = [];
        if (classId) {
            studentsData.forEach(student => {
                // Check if the student is enrolled in this class (we'd need enrollment data for this)
                // For now, let's assume all students are enrolled if they have scores
                const hasScores = scoresData.some(s => 
                    s.exam_id === examId && s.student_id === student.id
                );
                if (hasScores || student.status === 'active') {
                    enrolledStudentIds.push(student.id);
                }
            });
        }
        
        // Get all scores for this exam
        const examScores = scoresData.filter(s => s.exam_id === examId);
        
        // Get all students who have scores for this exam
        const studentIds = [...new Set(examScores.map(s => s.student_id))];
        
        // Combine with enrolled students
        const allStudentIds = [...new Set([...studentIds, ...enrolledStudentIds])];
        
        // Build student data with scores
        const students = allStudentIds.map(studentId => {
            const student = studentsData.find(s => s.id === studentId);
            const studentName = student ? student.name : 'Unknown Student';
            
            // Calculate total score for this student
            const studentScores = examScores.filter(s => s.student_id === studentId);
            const totalScore = studentScores.reduce((sum, s) => sum + s.score, 0);
            
            // Calculate max possible score
            const maxScore = problems.reduce((sum, p) => sum + p.max_score, 0);
            
            // Calculate percentage
            const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
            
            return {
                id: studentId,
                name: studentName,
                totalScore,
                maxScore,
                percentage,
                scores: studentScores
            };
        });
        
        // Calculate average score
        const totalPercentage = students.reduce((sum, s) => sum + s.percentage, 0);
        const averagePercentage = students.length > 0 ? Math.round(totalPercentage / students.length) : 0;
        
        return {
            id: exam.id,
            title: exam.title,
            description: exam.description,
            class: className,
            classId: classId,
            date,
            formattedDate: formatDate(date),
            status,
            problems,
            students,
            averagePercentage
        };
    }
    
    // Populate the exam details modal
    function populateExamDetailsModal(exam) {
        elements.scoreExamTitle.textContent = exam.title;
        elements.scoreExamClass.textContent = exam.class;
        elements.scoreExamDate.textContent = exam.formattedDate;
        
        const totalScore = exam.problems.reduce((sum, p) => sum + p.max_score, 0);
        elements.scoreExamTotal.textContent = totalScore;
        
        elements.scoreExamStatus.innerHTML = `
            <span class="status-badge status-${exam.status}">${capitalize(exam.status)}</span>
        `;
        
        elements.scoreExamAverage.textContent = `${exam.averagePercentage}%`;
        
        // Populate problems list
        elements.examProblemsList.innerHTML = '';
        exam.problems.forEach(problem => {
            const problemElement = document.createElement('div');
            problemElement.className = 'problem-item';
            problemElement.innerHTML = `
                <div class="problem-header">
                    <span class="problem-title">Problem ${problem.problem_number}: ${problem.title}</span>
                    <span class="problem-score">${problem.max_score} points</span>
                </div>
                <div class="problem-description">
                    ${problem.description || 'No description provided.'}
                </div>
            `;
            elements.examProblemsList.appendChild(problemElement);
        });
        
        // Populate student scores summary
        elements.scoreSummaryBody.innerHTML = '';
        exam.students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.totalScore}/${student.maxScore}</td>
                <td>${student.percentage}%</td>
            `;
            elements.scoreSummaryBody.appendChild(row);
        });
    }
    
    // Populate the exam scores modal
    function populateExamScoresModal(exam) {
        elements.detailExamTitle.textContent = exam.title;
        elements.detailExamClass.textContent = exam.class;
        elements.detailExamDate.textContent = exam.formattedDate;
        
        const totalScore = exam.problems.reduce((sum, p) => sum + p.max_score, 0);
        elements.detailExamTotal.textContent = totalScore;
        
        elements.detailExamStatus.innerHTML = `
            <span class="status-badge status-${exam.status}">${capitalize(exam.status)}</span>
        `;
        
        elements.detailExamDescription.textContent = exam.description || 'No description provided.';
        
        // Populate problems list
        elements.detailProblemsList.innerHTML = '';
        exam.problems.forEach(problem => {
            const problemElement = document.createElement('div');
            problemElement.className = 'problem-item';
            problemElement.innerHTML = `
                <div class="problem-header">
                    <span class="problem-title">Problem ${problem.problem_number}: ${problem.title}</span>
                    <span class="problem-score">${problem.max_score} points</span>
                </div>
                <div class="problem-description">
                    ${problem.description || 'No description provided.'}
                </div>
            `;
            elements.detailProblemsList.appendChild(problemElement);
        });
        
        // Populate student scores table
        elements.studentScoresBody.innerHTML = '';
        
        // Create header row with problem columns
        const headerRow = document.querySelector('.students-table thead tr');
        headerRow.innerHTML = `
            <th>Student</th>
            ${exam.problems.map(p => `<th>Problem ${p.problem_number}<br>(max: ${p.max_score})</th>`).join('')}
            <th>Total</th>
            <th>Comment</th>
        `;
        
        // Create rows for each student
        exam.students.forEach(student => {
            const row = document.createElement('tr');
            row.dataset.studentId = student.id;
            
            // Add student name cell
            let rowHtml = `<td>${student.name}</td>`;
            
            // Add score input cell for each problem
            exam.problems.forEach(problem => {
                const scoreRecord = student.scores.find(s => s.problem_id === problem.id);
                const score = scoreRecord ? scoreRecord.score : 0;
                rowHtml += `
                    <td>
                        <input type="number" class="score-input" 
                            min="0" max="${problem.max_score}" value="${score}"
                            data-problem-id="${problem.id}">
                    </td>
                `;
            });
            
            // Add total score cell
            rowHtml += `<td class="student-total">${student.totalScore}/${student.maxScore}</td>`;
            
            // Add comment cell - use the comment from the first score record
            const comment = student.scores.length > 0 ? student.scores[0].comment || '' : '';
            rowHtml += `
                <td>
                    <textarea class="comment-input">${comment}</textarea>
                </td>
            `;
            
            row.innerHTML = rowHtml;
            elements.studentScoresBody.appendChild(row);
            
            // Add event listeners to update total score when individual scores change
            const scoreInputs = row.querySelectorAll('.score-input');
            scoreInputs.forEach(input => {
                input.addEventListener('change', () => updateStudentTotalScore(row, exam.problems));
            });
        });
    }
    
    // Update student total score when individual scores change
    function updateStudentTotalScore(row, problems) {
        const scoreInputs = row.querySelectorAll('.score-input');
        let totalScore = 0;
        
        scoreInputs.forEach(input => {
            totalScore += parseInt(input.value) || 0;
        });
        
        const maxScore = problems.reduce((sum, p) => sum + p.max_score, 0);
        const totalCell = row.querySelector('.student-total');
        totalCell.textContent = `${totalScore}/${maxScore}`;
    }
    
    // Save exam scores
    async function saveExamScores() {
        try {
            await window.appUtils.showLoadingIndicator();
            
            // Get all student rows
            const studentRows = elements.studentScoresBody.querySelectorAll('tr');
            const formattedScores = [];
            
            // Process each student row
            studentRows.forEach(row => {
                const studentId = row.dataset.studentId;
                const scoreInputs = row.querySelectorAll('.score-input');
                const commentInput = row.querySelector('.comment-input');
                const comment = commentInput.value.trim();
                
                // Process each problem score
                scoreInputs.forEach(input => {
                    const problemId = input.dataset.problemId;
                    const score = parseInt(input.value) || 0;
                    
                    // Find if this score already exists
                    const existingScore = scoresData.find(s => 
                        s.exam_id === selectedExamId && 
                        s.student_id === studentId && 
                        s.problem_id === problemId
                    );
                    
                    formattedScores.push({
                        id: existingScore ? existingScore.id : null,
                        student_id: studentId,
                        problem_id: problemId,
                        score,
                        comment
                    });
                });
            });
            
            // Send scores to server
            const response = await fetch('/save-exam-scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    exam_id: selectedExamId,
                    scores: formattedScores
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save scores');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Update local scores data
                formattedScores.forEach(updatedScore => {
                    const existingScoreIndex = scoresData.findIndex(s => 
                        s.exam_id === selectedExamId && 
                        s.student_id === updatedScore.student_id &&
                        s.problem_id === updatedScore.problem_id
                    );
                    
                    if (existingScoreIndex !== -1) {
                        // Update existing score
                        scoresData[existingScoreIndex].score = updatedScore.score;
                        scoresData[existingScoreIndex].comment = updatedScore.comment;
                        scoresData[existingScoreIndex].last_updated = new Date().toISOString();
                    } else {
                        // Add new score
                        const newScoreId = updatedScore.id || generateScoreId();
                        scoresData.push({
                            id: newScoreId,
                            exam_id: selectedExamId,
                            student_id: updatedScore.student_id,
                            problem_id: updatedScore.problem_id,
                            score: updatedScore.score,
                            comment: updatedScore.comment,
                            date: new Date().toISOString().split('T')[0],
                            status: 'graded',
                            last_updated: new Date().toISOString()
                        });
                    }
                });
                
                // Update statistics
                updateStatistics();
                
                // Close modal
                elements.viewExamModal.classList.remove('show');
                
                alert('Scores saved successfully!');
            } else {
                throw new Error('Server returned success: false');
            }
            
        } catch (error) {
            console.error('Error saving exam scores:', error);
            alert(`Failed to save scores: ${error.message}`);
        } finally {
            await window.appUtils.hideLoadingIndicator();
        }
    }
    
    // Update statistics
    function updateStatistics() {
        // Count active exams
        const activeExams = examProblemsData
            .filter((ep, index, self) => 
                self.findIndex(e => e.exam_id === ep.exam_id) === index && // Unique exam IDs
                ep.status === EXAM_STATUS.ACTIVE
            );
        
        elements.activeExamsCount.textContent = activeExams.length;
        elements.totalExamsCount.textContent = examsData.length;
        
        // Calculate average score
        let totalPercentage = 0;
        let totalStudents = 0;
        
        // Group scores by exam and student
        const examStudentScores = {};
        
        scoresData.forEach(score => {
            const key = `${score.exam_id}|${score.student_id}`;
            if (!examStudentScores[key]) {
                examStudentScores[key] = {
                    examId: score.exam_id,
                    studentId: score.student_id,
                    totalScore: 0,
                    scores: []
                };
            }
            
            examStudentScores[key].totalScore += score.score;
            examStudentScores[key].scores.push(score);
        });
        
        // Calculate percentage for each student in each exam
        Object.values(examStudentScores).forEach(entry => {
            const examProblems = examProblemsData.filter(ep => ep.exam_id === entry.examId);
            const maxPossibleScore = examProblems.reduce((sum, p) => sum + p.max_score, 0);
            
            if (maxPossibleScore > 0) {
                const percentage = (entry.totalScore / maxPossibleScore) * 100;
                totalPercentage += percentage;
                totalStudents++;
            }
        });
        
        const averagePercentage = totalStudents > 0 ? Math.round(totalPercentage / totalStudents) : 0;
        elements.averageScore.textContent = `${averagePercentage}%`;
    }
    
    // Helper function to capitalize a string
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Generate unique IDs for new records
    function generateExamId() {
        return `E${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    function generateProblemId() {
        return `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    function generateScoreId() {
        return `S${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    // Initialize the page
    initPage();
})();
