# BrainDB Repository System Documentation

This document provides an overview of the repository system implemented in BrainDB, explaining how the data models, repositories, controllers, and APIs are structured.

## 1. Architecture Overview

BrainDB follows a layered architecture:

```
Client (Frontend) → API Routes → Controllers → Repositories → Google Sheets Database
```

The data flows through these layers, with each layer having a specific responsibility.

## 2. Repository Pattern

The repository pattern is implemented to provide a clean abstraction over data access operations. The key components are:

### 2.1 BaseRepository

The `BaseRepository` class serves as the foundation for all specific repositories. It provides generic CRUD operations:

- **getAll()**: Retrieve all records of a specific entity type
- **getById(id)**: Retrieve a single record by its ID
- **create(data)**: Create a new record
- **update(id, data)**: Update an existing record
- **delete(id)**: Delete a record

It also handles data conversion between JavaScript objects and Google Sheets format, and provides caching support for optimization.

### 2.2 Entity Repositories

Entity-specific repositories extend `BaseRepository` and provide entity-specific operations. The following repositories have been implemented:

- **students.repository.js**: Student management
- **classes.repository.js**: Class management
- **enrollment.repository.js**: Student enrollments in classes
- **attendance.repository.js**: Attendance tracking
- **lecture.repository.js**: Lecture management
- **homework.repository.js**: Homework management
- **problems.repository.js**: Problem bank
- **exams.repository.js**: Exam management
- **exam-problems.repository.js**: Problems included in exams
- **scores.repository.js**: Student scores on exam problems

## 3. Data Model

The data model reflects the database schema defined in `database.config.js`. Key entities include:

### 3.1 Students
- student_id: Unique identifier
- name: Student name
- school: School name
- generation: Student generation/batch
- number: Student number
- enrollment_date: Date of enrollment
- status: Student status (active/inactive)

### 3.2 Classes
- class_id: Unique identifier
- school: School name
- year: Academic year
- semester: Academic semester
- generation: Class generation
- schedule: Class schedule
- status: Class status

### 3.3 Enrollment
- enrollment_id: Unique identifier
- student_id: Reference to student
- class_id: Reference to class
- enrollment_date: Date of enrollment

### 3.4 Lecture
- lecture_id: Unique identifier
- class_id: Reference to class
- lecture_date: Date of lecture
- lecture_time: Time of lecture
- lecture_topic: Topic covered

### 3.5 Attendance
- attendance_id: Unique identifier
- lecture_id: Reference to lecture
- student_id: Reference to student
- status: Attendance status (present/absent/late)

### 3.6 Homework
- homework_id: Unique identifier
- lecture_id: Reference to lecture
- student_id: Reference to student
- total_problems: Total number of problems assigned
- completed_problems: Number of completed problems
- classification: Homework classification
- comments: Comments on homework

### 3.7 Problems
- problem_id: Unique identifier
- link: Link to problem
- subject: Problem subject area

### 3.8 Exams
- exam_id: Unique identifier
- lecture_id: Reference to lecture
- status: Exam status

### 3.9 Exam Problems
- exam_problem_id: Unique identifier
- exam_id: Reference to exam
- problem_id: Reference to problem
- problem_no: Problem number in exam
- total_score: Maximum possible score

### 3.10 Scores
- score_id: Unique identifier
- student_id: Reference to student
- exam_problem_id: Reference to exam problem
- score: Actual score awarded
- comment: Public comment
- internal_comment: Internal comment
- time: Time taken
- grader: Grader identifier
- graded_date: Grading date

## 4. Controllers

Controllers handle HTTP requests, perform input validation, and interact with repositories. Key controllers:

- **students.controller.js**: Student management operations
- **classes.controller.js**: Class management operations
- **enrollment.controller.js**: Enrollment management
- **attendance.controller.js**: Attendance tracking
- **lecture.controller.js**: Lecture management
- **homework.controller.js**: Homework management
- **scores.controller.js**: Exam scores management

## 5. API Routes

API routes define the HTTP endpoints that the frontend can interact with:

- **/api/students**: Student management endpoints
- **/api/classes**: Class management endpoints
- **/api/enrollment**: Enrollment management endpoints
- **/api/attendance**: Attendance tracking endpoints
- **/api/lectures**: Lecture management endpoints
- **/api/homework**: Homework management endpoints
- **/api/exams**: Exam management endpoints
- **/api/scores**: Exam scores management endpoints
- **/api/analytics**: Analytics and report endpoints

## 6. Services

Supporting services:

- **google-api.service.js**: Handles interaction with Google Sheets API
- **logger.service.js**: Centralized logging
- **cache.service.js**: Caching for optimization

## 7. Future Enhancements

Potential future enhancements:

1. Implement unit tests for repositories and controllers
2. Add transaction support for operations that affect multiple entities
3. Add more advanced querying capabilities
4. Implement pagination for large datasets
5. Add user authentication and authorization
6. Implement real-time updates via WebSockets

## 8. Usage Examples

### Example: Create a new student

```javascript
// Controller code (simplified)
async function createStudent(req, res) {
  const studentData = req.body;
  const newStudent = await studentsRepository.create(studentData);
  res.status(201).json({
    success: true,
    data: newStudent
  });
}
```

### Example: Get attendance for a lecture

```javascript
// Controller code (simplified)
async function getLectureAttendance(req, res) {
  const lectureId = req.params.id;
  const attendanceRecords = await attendanceRepository.getByLectureId(lectureId);
  res.json({
    success: true,
    data: attendanceRecords
  });
}
```
