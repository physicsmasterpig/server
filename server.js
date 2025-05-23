// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');
const multer = require('multer'); // For file uploads
const xlsx = require('xlsx'); // For Excel processing
const winston = require('winston'); // For structured logging
const NodeCache = require('node-cache');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { DataUtils, API_CONSTANTS, CacheManager } = require('./public/utils');

// Add structured logging with winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple API endpoint for testing
app.get('/api/students/test', (req, res) => {
  logger.info('Test student endpoint accessed');
  res.json({
    success: true,
    data: [
      { id: '1', name: 'John Doe', school: 'High School A', status: 'active' },
      { id: '2', name: 'Jane Smith', school: 'High School B', status: 'active' },
      { id: '3', name: 'Bob Johnson', school: 'High School A', status: 'inactive' }
    ]
  });
});

// Serve template files
app.get('/templates/:template', (req, res) => {
  const templateName = req.params.template;
  const templatePath = path.join(__dirname, 'public', 'templates', templateName);
  
  // Security check: ensure the template exists and is a .html file
  if (!templateName.endsWith('.html')) {
    return res.status(400).send('Invalid template format');
  }
  
  fs.access(templatePath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`Template not found: ${templateName}`);
      return res.status(404).send('Template not found');
    }
    
    res.sendFile(templatePath);
  });
});

// Serve render content for page navigation
app.get('/render/:page', (req, res) => {
  const pageName = req.params.page;
  // Only allow alphanumeric page names for security
  if (!/^[a-zA-Z0-9-]+$/.test(pageName)) {
    return res.status(400).send('Invalid page name');
  }
  
  const pagePath = path.join(__dirname, 'public', 'menu-content', `${pageName}.html`);
  
  fs.access(pagePath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`Page content not found: ${pageName}`);
      return res.status(404).send(`<p>Page content for "${pageName}" not found.</p>`);
    }
    
    // Read the file content instead of sending the file directly
    // This allows for future templating/processing if needed
    fs.readFile(pagePath, 'utf8', (readErr, content) => {
      if (readErr) {
        logger.error(`Error reading page content for ${pageName}: ${readErr}`);
        return res.status(500).send('Error loading page content');
      }
      
      res.send(content);
    });
  });
});

// Configure file upload storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Google API Authentication
let sheets, drive;

// Refactor Google API initialization
async function initializeGoogleAPIs() {
  try {
    // Support both local file and environment variables
    let keys;
    if (process.env.GOOGLE_CREDENTIALS) {
      keys = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else {
      try {
        keys = JSON.parse(fs.readFileSync('credential.json', 'utf8'));
      } catch (err) {
        logger.error('Failed to read credential.json:', err);
        logger.info('Will attempt to use environment variables instead');
        
        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
          throw new Error('No credentials found. Please provide credential.json or set environment variables');
        }
        
        keys = {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
      }
    }
    
    const client = new google.auth.JWT(
      keys.client_email,
      null,
      keys.private_key.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    );

    await client.authorize();
    logger.info('Connected to Google APIs');

    sheets = google.sheets({ version: 'v4', auth: client });
    drive = google.drive({ version: 'v3', auth: client });

    const folderId = await createAppFolder();
    logger.info(`App folder created or found with ID: ${folderId}`);
    app.locals.driveFolderId = folderId;
  } catch (error) {
    logger.error('Failed to initialize Google APIs:', error);
    if (process.env.NODE_ENV === 'production') {
      // In production, keep the server running even with API errors
      logger.warn('Running in production mode without Google APIs');
    } else {
      process.exit(1); // Only exit in development
    }
  }
}

// Cache configuration
const dataCache = CacheManager;
const CACHE_TTL = 300; // 5 minutes
const RATE_LIMIT_DELAY = 100; // 100ms base delay

// Helper function for exponential backoff
async function retryWithBackoff(operation, maxRetries = API_CONSTANTS.RETRY.MAX_RETRIES, 
                               initialDelay = API_CONSTANTS.RETRY.INITIAL_DELAY, 
                               maxDelay = API_CONSTANTS.RETRY.MAX_DELAY) {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      // Check if this is a quota exceeded error or rate limit
      const isQuotaError = error.message && (
        error.message.includes('Quota exceeded') ||
        error.message.includes('Rate limit exceeded') ||
        error.message.includes('User rate limit exceeded') ||
        error.code === 429
      );
      
      // If we've reached max retries or it's not a quota error, throw the error
      if (retries >= maxRetries || !isQuotaError) {
        throw error;
      }
      
      // Log the retry attempt
      logger.info(`API quota exceeded. Retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
      
      // Wait for the delay period
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase retries and apply exponential backoff with jitter
      retries++;
      const jitter = 1 - API_CONSTANTS.RETRY.JITTER_FACTOR + 
                     Math.random() * API_CONSTANTS.RETRY.JITTER_FACTOR * 2;
      delay = Math.min(delay * 2 * jitter, maxDelay);
    }
  }
}

// Cached sheet data fetcher with retry
async function fetchSheetData(sheetRange) {
  const cacheKey = `sheet-${sheetRange}`;
  const cachedData = dataCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  const result = await retryWithBackoff(async () => {
    return await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange
    });
  });
  
  const data = result.data.values || [];
  dataCache.set(cacheKey, data, CACHE_TTL);
  return data;
}

// Add a new batch operation function for Google Sheets
async function batchSheetOperation(operations) {
  if (operations.length === 0) return [];
  
  // Split operations into batches to avoid API limits
  const batchSize = API_CONSTANTS.BATCH_SIZE.UPDATES;
  const batches = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    batches.push(operations.slice(i, i + batchSize));
  }
  
  const results = [];
  
  for (const batch of batches) {
    // Create a batch request
    const batchRequest = {
      spreadsheetId,
      resource: {
        data: batch.map(op => ({
          range: op.range,
          values: op.values,
        })),
        valueInputOption: 'USER_ENTERED'
      }
    };
    
    // Execute the batch request with retry logic
    const result = await retryWithBackoff(async () => {
      return await sheets.spreadsheets.values.batchUpdate(batchRequest);
    });
    
    results.push(result);
    
    // Small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Replace the findAttendanceRecord function with a more efficient version
async function findAttendanceRecord(lectureId, studentId) {
  try {
    const rows = await fetchSheetData(sheetsRange.attendance);
    
    // Use a composite key approach for faster lookups in memory
    const key = `${lectureId}|${studentId}`;
    const lookupMap = dataCache.get('attendance-lookup');
    
    if (lookupMap && lookupMap.has(key)) {
      return lookupMap.get(key);
    }
    
    // If not in cache, rebuild the lookup map
    const newMap = new Map();
    rows.forEach((row, index) => {
      const rowKey = `${row[1]}|${row[2]}`; // lectureId|studentId
      newMap.set(rowKey, { rowIndex: index, row });
    });
    
    dataCache.set('attendance-lookup', newMap, CACHE_TTL);
    return newMap.get(key) || null;
  } catch (error) {
    logger.error(`Error finding attendance record:`, error);
    throw error;
  }
}

// Replace the findHomeworkRecord function with a more efficient version
async function findHomeworkRecord(lectureId, studentId) {
  try {
    const rows = await fetchSheetData(sheetsRange.homework);
    
    // Use a composite key approach for faster lookups in memory
    const key = `${lectureId}|${studentId}`;
    const lookupMap = dataCache.get('homework-lookup');
    
    if (lookupMap && lookupMap.has(key)) {
      return lookupMap.get(key);
    }
    
    // If not in cache, rebuild the lookup map
    const newMap = new Map();
    rows.forEach((row, index) => {
      const rowKey = `${row[1]}|${row[2]}`; // lectureId|studentId
      newMap.set(rowKey, { rowIndex: index, row });
    });
    
    dataCache.set('homework-lookup', newMap, CACHE_TTL);
    return newMap.get(key) || null;
  } catch (error) {
    logger.error(`Error finding homework record:`, error);
    throw error;
  }
}

// Move sensitive data to environment variables
const spreadsheetId = process.env.SPREADSHEET_ID || "1NbcwKdFAwm0RRw5JIpaOMtCibWM_9gsUbYCOQ2GUNlI";

// Define sheet ranges
const sheetsRange = {   
  'student': 'student!A2:G', 
  'class': 'class!A2:G', 
  'lecture': 'lecture!A2:E', 
  'enrollment': 'enrollment!A2:D', 
  'attendance': 'attendance!A2:D', 
  'homework': 'homework!A2:G', 
  'exam': 'exam!A2:B', 
  'problem': 'problem!A2:C', 
  'exam_problem': 'exam_problem!A2:E',
  'score': 'score!A2:I'     
};

// Create a folder in Drive (run once to set up)
async function createAppFolder() {
  try {
    // First check if the folder already exists
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='BrainDB_Uploads' and trashed=false",
      fields: 'files(id, name)'
    });
    
    if (response.data.files.length > 0) {
      logger.info('App folder already exists:', response.data.files[0].id);
      return response.data.files[0].id;
    }
    
    // Create new folder if it doesn't exist
    const folderMetadata = {
      name: 'BrainDB_Uploads',
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });
    
    logger.info('New folder created with ID:', folder.data.id);
    return folder.data.id;
  } catch (error) {
    logger.error('Error with app folder:', error);
    throw error;
  }
}

// Upload a file to Google Drive
async function uploadFileToDrive(filePath, fileName, folderId) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const media = {
      mimeType: getMimeType(fileName),
      body: fs.createReadStream(filePath)
    };
    
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink'
    });
    
    return {
      fileId: file.data.id,
      webViewLink: file.data.webViewLink
    };
  } catch (error) {
    logger.error('Error uploading file:', error);
    throw error;
  }
}

// Helper to determine MIME type
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Serve assets directory
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Add cache control headers for static assets
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  }
}));

// Add consistent error response structure
function handleError(res, error, statusCode = 500) {
  res.status(statusCode).json({ success: false, error: error.message || error });
}

// File upload endpoint
app.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded' });
    }
    
    if (!drive) {
      return res.status(500).send({ error: 'Drive API not initialized' });
    }
    
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    // Get the folder ID from app locals or create a new folder
    let folderId = app.locals.driveFolderId;
    if (!folderId) {
      folderId = await createAppFolder();
      app.locals.driveFolderId = folderId;
    }
    
    // Upload to Google Drive
    const driveFile = await uploadFileToDrive(filePath, fileName, folderId);
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    res.status(200).send({
      message: 'File uploaded successfully',
      fileId: driveFile.fileId,
      fileUrl: driveFile.webViewLink
    });
  } catch (error) {
    logger.error('Error processing file upload:', error);
    res.status(500).send({ error: error.message });
  }
});

// Routes
app.get('/render/:page', (req, res) => {
  const pageName = req.params.page;
  // Only allow alphanumeric page names for security
  if (!/^[a-zA-Z0-9-]+$/.test(pageName)) {
    return res.status(400).send('Invalid page name');
  }
  
  const pagePath = path.join(__dirname, 'public', 'menu-content', `${pageName}.html`);
  
  fs.access(pagePath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`Page content not found: ${pageName}`);
      return res.status(404).send(`<p>Page content for "${pageName}" not found.</p>`);
    }
    
    // Read the file content instead of sending the file directly
    // This allows for future templating/processing if needed
    fs.readFile(pagePath, 'utf8', (readErr, content) => {
      if (readErr) {
        logger.error(`Error reading page content for ${pageName}: ${readErr}`);
        return res.status(500).send('Error loading page content');
      }
      
      res.send(content);
    });
  });
});

// Load list from Google Sheets
app.get('/load-list/:id', async (req, res) => {
  const { id } = req.params;

  if (!sheets) {
    return handleError(res, 'Google Sheets API not initialized', 503);
  }

  if (!sheetsRange[id]) {
    return handleError(res, 'Invalid sheet ID', 400);
  }

  try {
    const data = await fetchSheetData(sheetsRange[id]);
    res.json({ success: true, data: data || [] });
  } catch (err) {
    logger.error(`Error loading ${id} list:`, err);
    handleError(res, err);
  }
});

// Add single student or multiple students
app.post('/add-student', async (req, res) => {
  if (!sheets) {
    return res.status(503).send({ error: 'Google Sheets API not initialized' });
  }
  
  try {
    const students = Array.isArray(req.body) ? req.body : [req.body];
    
    // Format data for Google Sheets
    const values = students.map(student => [
      student.student_id,
      student.name,
      student.school,
      student.generation,
      student.number,
      student.enrollment_date,
      student.status
    ]);
    
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetsRange.student,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    res.status(200).json({
      message: `${students.length} students added successfully`,
      updatedRows: result.data.updates.updatedRows
    });
  } catch (err) {
    logger.error('Error adding student(s):', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload student data from Excel/CSV file
app.post('/upload-student-file', upload.single('file'), async (req, res) => {
  if (!sheets) {
    return res.status(503).send({ error: 'Google Sheets API not initialized' });
  }
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert Excel data to JSON
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Extract common fields from request if available
    const commonSchool = req.body.commonSchool || '';
    const commonGeneration = req.body.commonGeneration || '';
    const commonEnrollmentDate = req.body.commonEnrollmentDate || '';
    
    // Format student data
    const students = data.map(row => ({
      student_id: generateStudentId(),
      name: row.Name || '',
      school: row.School || commonSchool,
      generation: row.Generation || commonGeneration,
      number: row.Phone || '',
      enrollment_date: row.EnrollmentDate || commonEnrollmentDate,
      status: 'active'
    }));
    
    // Call the add-student endpoint to process the data
    const values = students.map(student => [
      student.student_id,
      student.name,
      student.school,
      student.generation,
      student.number,
      student.enrollment_date,
      student.status
    ]);
    
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetsRange.student,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      message: `${students.length} students imported successfully`,
      updatedRows: result.data.updates.updatedRows
    });
  } catch (err) {
    logger.error('Error processing uploaded file:', err);
    res.status(500).json({ error: err.message });
  }
});


// Add these routes to server.js for class management with the updated database structure

// Add a new class with lectures and enrollment
app.post('/add-class', async (req, res) => {
  try {
    const classData = req.body;
    
    // 1. Add the class
    const classValues = [
      classData.class_id,
      classData.school,
      classData.year,
      classData.semester,
      classData.generation,
      classData.schedule,
      classData.status
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetsRange.class,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [classValues] }
    });
    
    // 2. Add lectures
    if (classData.lectures && classData.lectures.length > 0) {
      const lectureValues = classData.lectures.map(lecture => [
        lecture.lecture_id,
        classData.class_id,
        lecture.lecture_date,
        lecture.lecture_time,
        lecture.lecture_topic
      ]);
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetsRange.lecture,
        valueInputOption: 'USER_ENTERED',
        resource: { values: lectureValues }
      });
    }
    
    // 3. Add student enrollments
    if (classData.enrollments && classData.enrollments.length > 0) {
      const enrollmentValues = classData.enrollments.map(enrollment => [
        enrollment.enrollment_id,
        enrollment.student_id,
        classData.class_id,
        enrollment.enrollment_date
      ]);
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetsRange.enrollment,
        valueInputOption: 'USER_ENTERED',
        resource: { values: enrollmentValues }
      });
    }
    
    res.status(200).json({
      message: 'Class created successfully',
      class_id: classData.class_id,
      lectures_added: classData.lectures ? classData.lectures.length : 0,
      enrollments_added: classData.enrollments ? classData.enrollments.length : 0
    });
    
  } catch (err) {
    logger.error('Error adding class:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get class details (lectures and enrolled students) with caching
app.get('/class-details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use cached data for each sheet
    const classRows = await fetchSheetData(sheetsRange.class);
    const classData = classRows.find(row => row[0] == id);
    
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Get lectures, enrollments, and student data in parallel to improve performance
    const [lectureRows, enrollmentRows, studentRows] = await Promise.all([
      fetchSheetData(sheetsRange.lecture),
      fetchSheetData(sheetsRange.enrollment),
      fetchSheetData(sheetsRange.student)
    ]);
    
    // Filter lectures for this class
    const lectures = lectureRows
      .filter(row => row[1] == id)
      .map(row => ({
        lecture_id: row[0],
        class_id: row[1],
        lecture_date: row[2],
        lecture_time: row[3],
        lecture_topic: row[4]
      }));
    
    // Filter enrollments for this class
    const enrollments = enrollmentRows
      .filter(row => row[2] == id)
      .map(row => ({
        enrollment_id: row[0],
        student_id: row[1],
        class_id: row[2],
        enrollment_date: row[3]
      }));
    
    // Map enrolled students
    const enrolledStudents = enrollments.map(enrollment => {
      const studentData = studentRows.find(row => row[0] == enrollment.student_id);
      return studentData ? {
        student_id: studentData[0],
        name: studentData[1],
        school: studentData[2],
        generation: studentData[3],
        number: studentData[4],
        enrollment_date: enrollment.enrollment_date
      } : null;
    }).filter(student => student !== null);
    
    // Compose the response
    const classDetails = {
      class_id: classData[0],
      school: classData[1],
      year: classData[2],
      semester: classData[3],
      generation: classData[4],
      schedule: classData[5],
      status: classData[6],
      lectures: lectures,
      enrolled_students: enrolledStudents
    };
    
    res.status(200).json(classDetails);
    
  } catch (err) {
    logger.error('Error fetching class details:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add attendance for a lecture
app.post('/attendance', async (req, res) => {
  try {
    const { lecture_id, attendance_data } = req.body;
    
    if (!lecture_id || !attendance_data || !Array.isArray(attendance_data)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    // Format attendance records
    const attendanceValues = attendance_data.map(record => [
      record.attendance_id,      // Generate a unique ID for each attendance record
      lecture_id,                // The lecture ID
      record.student_id,         // Student ID
      record.status              // Attendance status (e.g., "ATT" for attended)
    ]);
    
    // Add attendance records
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetsRange.attendance,
      valueInputOption: 'USER_ENTERED',
      resource: { values: attendanceValues }
    });
    
    res.status(200).json({
      message: 'Attendance recorded successfully',
      attendance_records: attendanceValues.length
    });
    
  } catch (err) {
    logger.error('Error recording attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for a lecture
app.get('/attendance/:lecture_id', async (req, res) => {
  try {
    const { lecture_id } = req.params;
    
    // Get all attendance records for this lecture
    const attendanceResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetsRange.attendance
    });
    
    const attendanceRows = attendanceResponse.data.values || [];
    const lectureAttendance = attendanceRows
      .filter(row => row[1] == lecture_id)
      .map(row => ({
        attendance_id: row[0],
        lecture_id: row[1],
        student_id: row[2],
        status: row[3]
      }));
    
    // Get student data for context
    const studentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetsRange.student
    });
    
    const studentRows = studentResponse.data.values || [];
    
    // Combine attendance with student data
    const attendanceWithStudentInfo = lectureAttendance.map(attendance => {
      const studentData = studentRows.find(row => row[0] == attendance.student_id);
      return {
        ...attendance,
        student_name: studentData ? studentData[1] : 'Unknown',
        student_school: studentData ? studentData[2] : 'Unknown',
        student_generation: studentData ? studentData[3] : 'Unknown'
      };
    });
    
    res.status(200).json({
      lecture_id,
      attendance: attendanceWithStudentInfo
    });
    
  } catch (err) {
    logger.error('Error fetching attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

// In server.js or a dedicated routes file
app.post('/save-attendance-homework', async (req, res) => {
    try {
        const { lecture_id, attendance_data, homework_data } = req.body;

        // Validate lecture exists
        const lectureExists = await verifyLectureExists(lecture_id);
        if (!lectureExists) {
            return res.status(404).json({ error: 'Lecture not found' });
        }

        // Invalidate relevant caches to ensure fresh data
        dataCache.clear('sheet-' + sheetsRange.attendance);
        dataCache.clear('sheet-' + sheetsRange.homework);
        dataCache.clear('attendance-lookup');
        dataCache.clear('homework-lookup');

        // Prepare batch operations for attendance updates
        const attendanceUpdates = [];
        const attendanceInserts = [];
        
        // Process attendance data in parallel using Promise.all
        await Promise.all(attendance_data.map(async record => {
            const existingRecord = await findAttendanceRecord(record.lecture_id, record.student_id);

            if (existingRecord) {
                const sheetRow = existingRecord.rowIndex + 2; // Account for header row
                attendanceUpdates.push({
                    range: `attendance!D${sheetRow}:D${sheetRow}`,
                    values: [[record.status]]
                });
            } else {
                attendanceInserts.push([
                    record.attendance_id || DataUtils.generateUniqueId('AT'),
                    record.lecture_id,
                    record.student_id,
                    record.status
                ]);
            }
        }));

        // Execute attendance updates in batch
        if (attendanceUpdates.length > 0) {
            await batchSheetOperation(attendanceUpdates);
        }

        // Execute attendance inserts
        if (attendanceInserts.length > 0) {
            await retryWithBackoff(async () => {
                return sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: sheetsRange.attendance,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: attendanceInserts }
                });
            });
        }

        // Prepare batch operations for homework updates
        const homeworkUpdates = [];
        const homeworkInserts = [];

        // Process homework data in parallel using Promise.all
        await Promise.all(homework_data.map(async record => {
            const existingRecord = await findHomeworkRecord(record.lecture_id, record.student_id);

            if (existingRecord) {
                const sheetRow = existingRecord.rowIndex + 2; // Account for header row
                homeworkUpdates.push({
                    range: `homework!C${sheetRow}:G${sheetRow}`,
                    values: [[
                        record.total_problems,
                        record.completed_problems,
                        record.classification,
                        record.comments,
                        new Date().toISOString() // Add last updated timestamp
                    ]]
                });
            } else {
                homeworkInserts.push([
                    record.homework_id || DataUtils.generateUniqueId('HW'),
                    record.lecture_id,
                    record.student_id,
                    record.total_problems,
                    record.completed_problems,
                    record.classification,
                    record.comments,
                    new Date().toISOString() // Add creation timestamp
                ]);
            }
        }));

        // Execute homework updates in batch
        if (homeworkUpdates.length > 0) {
            await batchSheetOperation(homeworkUpdates);
        }

        // Execute homework inserts
        if (homeworkInserts.length > 0) {
            await retryWithBackoff(async () => {
                return sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: sheetsRange.homework,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: homeworkInserts }
                });
            });
        }

        // Make sure to invalidate caches again after all operations are complete
        dataCache.clear('sheet-' + sheetsRange.attendance);
        dataCache.clear('sheet-' + sheetsRange.homework);
        dataCache.clear('attendance-lookup');
        dataCache.clear('homework-lookup');

        // Return success response with the updated records included in the response
        // This lets the client know exactly what was saved
        res.status(200).json({
            success: true,
            message: 'Attendance and homework data saved successfully',
            attendance: {
                updated: attendanceUpdates.length,
                inserted: attendanceInserts.length,
                records: [...attendanceInserts.map(arr => ({
                    id: arr[0],
                    lecture_id: arr[1],
                    student_id: arr[2],
                    status: arr[3]
                })), ...attendance_data]
            },
            homework: {
                updated: homeworkUpdates.length,
                inserted: homeworkInserts.length,
                records: [...homeworkInserts.map(arr => ({
                    id: arr[0],
                    lecture_id: arr[1],
                    student_id: arr[2],
                    total_problems: arr[3],
                    completed_problems: arr[4],
                    classification: arr[5],
                    comments: arr[6]
                })), ...homework_data]
            }
        });

    } catch (error) {
        logger.error('Error saving attendance and homework:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save data',
            error: error.message
        });
    }
});

// Helper function implementations would interact with your Google Sheets
// Refactor duplicate logic into a utility function
async function findRecord(sheetRange, matchFn) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange
    });

    const rows = result.data.values || [];
    return rows.find(matchFn) || null;
  } catch (error) {
    logger.error(`Error finding record in range ${sheetRange}:`, error);
    throw error;
  }
}

// Update findAttendanceRecord to use cached data
async function findAttendanceRecord(lectureId, studentId) {
  try {
    const rows = await fetchSheetData(sheetsRange.attendance);
    const rowIndex = rows.findIndex(row => row[1] === lectureId && row[2] === studentId);

    if (rowIndex === -1) {
      return null;
    }

    return { rowIndex, row: rows[rowIndex] };
  } catch (error) {
    logger.error(`Error finding attendance record:`, error);
    throw error;
  }
}

// Update findHomeworkRecord to use cached data
async function findHomeworkRecord(lectureId, studentId) {
  try {
    const rows = await fetchSheetData(sheetsRange.homework);
    const rowIndex = rows.findIndex(row => row[1] === lectureId && row[2] === studentId);

    if (rowIndex === -1) {
      return null;
    }

    return { rowIndex, row: rows[rowIndex] };
  } catch (error) {
    logger.error(`Error finding homework record:`, error);
    throw error;
  }
}

// Update verifyLectureExists to use cached data
async function verifyLectureExists(lectureId) {
  try {
    const rows = await fetchSheetData(sheetsRange.lecture);
    return rows.some(row => row[0] === lectureId);
  } catch (error) {
    logger.error('Error verifying lecture exists:', error);
    throw error;
  }
}

async function updateAttendanceRecord(recordId, status) {
    try {
        // First, get the row index of the record
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetsRange.attendance
        });

        const attendanceRows = result.data.values || [];
        const rowIndex = attendanceRows.findIndex(row => row[0] === recordId);

        if (rowIndex === -1) {
            throw new Error(`Attendance record with ID ${recordId} not found`);
        }

        // The actual row in the sheet is rowIndex + 2 (header row + 0-indexing)
        const sheetRow = rowIndex + 2;

        // Update the record
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `attendance!D${sheetRow}:D${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[status]]
            }
        });

        return true;
    } catch (error) {
        logger.error('Error updating attendance record:', error);
        throw error;
    }
}

async function createAttendanceRecord(record) {
try {
      // Generate a unique ID if not provided
      const attendanceId = record.attendance_id || `AT${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Append the new record
      await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: sheetsRange.attendance,
          valueInputOption: 'USER_ENTERED',
          resource: {
              values: [[
                  attendanceId,
                  record.lecture_id,
                  record.student_id,
                  record.status
              ]]
          }
      });
      
      return attendanceId;
  } catch (error) {
      logger.error('Error creating attendance record:', error);
      throw error;
  }
}

async function updateHomeworkRecord(recordId, data) {
  try {
      // First, get the row index of the record
      const result = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: sheetsRange.homework
      });
      
      const homeworkRows = result.data.values || [];
      const rowIndex = homeworkRows.findIndex(row => row[0] === recordId);
      
      if (rowIndex === -1) {
          throw new Error(`Homework record with ID ${recordId} not found`);
      }
      
      // The actual row in the sheet is rowIndex + 2 (header row + 0-indexing)
      const sheetRow = rowIndex + 2;
      
      // Update the record
      await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `homework!C${sheetRow}:G${sheetRow}`, // Update columns C through G
          valueInputOption: 'USER_ENTERED',
          resource: {
              values: [[
                  data.total_problems,
                  data.completed_problems,
                  data.classification,
                  data.comments
              ]]
          }
      });
      
      return true;
  } catch (error) {
      logger.error('Error updating homework record:', error);
      throw error;
  }
}

async function createHomeworkRecord(record) {
  try {
      // Generate a unique ID if not provided
      const homeworkId = record.homework_id || `HW${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Append the new record
      await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: sheetsRange.homework,
          valueInputOption: 'USER_ENTERED',
          resource: {
              values: [[
                  homeworkId,
                  record.lecture_id,
                  record.student_id,
                  record.total_problems,
                  record.completed_problems,
                  record.classification,
                  record.comments
              ]]
          }
      });
      
      return homeworkId;
  } catch (error) {
      logger.error('Error creating homework record:', error);
      throw error;
  }
}

// Helper function to generate a student ID
function generateStudentId() {
  return DataUtils.IdGenerator.student();
}

// Add a route to update student status
app.post('/update-student-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!sheets) {
        return handleError(res, 'Google Sheets API not initialized', 503);
    }

    if (!id || !status) {
        return handleError(res, 'Invalid request data', 400);
    }

    try {
        // Fetch the student data
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetsRange.student
        });

        const studentRows = result.data.values || [];
        const rowIndex = studentRows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return handleError(res, `Student with ID ${id} not found`, 404);
        }

        // Update the status in the sheet
        const sheetRow = rowIndex + 2; // Account for header row
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `student!G${sheetRow}:G${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[status]]
            }
        });

        res.status(200).json({ success: true, message: 'Student status updated successfully' });
    } catch (error) {
        logger.error('Error updating student status:', error);
        handleError(res, error);
    }
});

// Add exam-related API endpoints

// Load exam list
app.get('/load-list/exam', async (req, res) => {
  try {
    const examRows = await fetchSheetData(sheetsRange.exam);
    res.status(200).json({ success: true, data: examRows });
  } catch (err) {
    logger.error('Error loading exam list:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load problem list
app.get('/load-list/problem', async (req, res) => {
  try {
    const problemRows = await fetchSheetData(sheetsRange.problem);
    res.status(200).json({ success: true, data: problemRows });
  } catch (err) {
    logger.error('Error loading problem list:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load exam-problem relationships
app.get('/load-list/exam_problem', async (req, res) => {
  try {
    const examProblemRows = await fetchSheetData(sheetsRange.exam_problem);
    res.status(200).json({ success: true, data: examProblemRows });
  } catch (err) {
    logger.error('Error loading exam-problem relationships:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load scores
app.get('/load-list/score', async (req, res) => {
  try {
    const scoreRows = await fetchSheetData(sheetsRange.score);
    res.status(200).json({ success: true, data: scoreRows });
  } catch (err) {
    logger.error('Error loading scores:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new exam
app.post('/add-exam', async (req, res) => {
  try {
    const { exam_id, title, date, class_id, status, description, problems } = req.body;
    
    // Validate required fields
    if (!exam_id || !title || !date || !class_id || !problems || problems.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required exam information' });
    }

    // Cache current data
    const examRows = await fetchSheetData(sheetsRange.exam);
    const problemRows = await fetchSheetData(sheetsRange.problem);
    const examProblemRows = await fetchSheetData(sheetsRange.exam_problem);

    // Process in batch to optimize API calls
    const batchRequests = [];

    // Add exam record
    const examRecord = [
      exam_id,
      title,
      description || ''
    ];
    batchRequests.push({
      range: sheetsRange.exam,
      values: [examRecord]
    });

    // Add problem records and exam-problem relationships
    const newProblemRecords = [];
    const newExamProblemRecords = [];

    problems.forEach((problem) => {
      // Create problem record
      const problemRecord = [
        problem.problem_id,
        problem.title,
        problem.description || ''
      ];
      newProblemRecords.push(problemRecord);

      // Create exam-problem relationship
      const examProblemId = `EP${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const examProblemRecord = [
        examProblemId,
        exam_id,
        problem.problem_id,
        problem.max_score,
        problem.problem_number,
        date,
        class_id,
        status
      ];
      newExamProblemRecords.push(examProblemRecord);
    });

    // Add problem records
    if (newProblemRecords.length > 0) {
      batchRequests.push({
        range: sheetsRange.problem,
        values: newProblemRecords
      });
    }

    // Add exam-problem relationships
    if (newExamProblemRecords.length > 0) {
      batchRequests.push({
        range: sheetsRange.exam_problem,
        values: newExamProblemRecords
      });
    }

    // Perform batch update with exponential backoff
    await batchUpdateSheetData(batchRequests);

    res.status(200).json({ 
      success: true, 
      message: 'Exam created successfully',
      examId: exam_id
    });
  } catch (err) {
    logger.error('Error creating exam:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save exam scores
app.post('/save-exam-scores', async (req, res) => {
  try {
    const { exam_id, scores } = req.body;
    
    // Validate required fields
    if (!exam_id || !scores || scores.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required score information' 
      });
    }

    // Cache current data
    const scoreRows = await fetchSheetData(sheetsRange.score);
    
    // Find existing scores to determine updates vs inserts
    const existingScores = scoreRows.filter(row => row[1] === exam_id);
    const scoresToUpdate = [];
    const scoresToInsert = [];

    // Process scores data
    scores.forEach(score => {
      const existing = existingScores.find(
        row => row[1] === exam_id && 
              row[2] === score.student_id && 
              row[3] === score.problem_id
      );

      if (existing) {
        // Update existing score
        const updatedScore = [...existing];
        updatedScore[4] = score.score; // Score value
        updatedScore[5] = score.comment || ''; // Comment
        updatedScore[8] = new Date().toISOString(); // Last updated
        scoresToUpdate.push(updatedScore);
      } else {
        // Create new score record
        const newScore = [
          score.id || `S${Date.now()}${Math.floor(Math.random() * 1000)}`,
          exam_id,
          score.student_id,
          score.problem_id,
          score.score,
          score.comment || '',
          new Date().toISOString().split('T')[0], // Date
          'graded', // Status
          new Date().toISOString() // Last updated
        ];
        scoresToInsert.push(newScore);
      }
    });

    // Process in batch to optimize API calls
    const batchRequests = [];

    // Add new scores
    if (scoresToInsert.length > 0) {
      batchRequests.push({
        range: sheetsRange.score,
        values: scoresToInsert
      });
    }

    // Update existing scores (separate updates for each row)
    for (const scoreToUpdate of scoresToUpdate) {
      const scoreId = scoreToUpdate[0];
      const rowIndex = scoreRows.findIndex(row => row[0] === scoreId);
      
      if (rowIndex !== -1) {
        const range = `${sheetsRange.score.split('!')[0]}!A${rowIndex + 2}:I${rowIndex + 2}`;
        batchRequests.push({
          range: range,
          values: [scoreToUpdate]
        });
      }
    }

    // Perform batch update with exponential backoff
    if (batchRequests.length > 0) {
      await batchUpdateSheetData(batchRequests);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Exam scores saved successfully' 
    });
  } catch (err) {
    logger.error('Error saving exam scores:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch update sheet data with retries
async function batchUpdateSheetData(batchRequests) {
  try {
    // Convert batch requests to the format expected by batchSheetOperation
    const operations = batchRequests.map(request => ({
      range: request.range,
      values: request.values
    }));
    
    return await batchSheetOperation(operations);
  } catch (error) {
    logger.error('Error in batch update:', error);
    throw error;
  }
}

// Utility functions for API requests
// Retry function with exponential backoff for handling rate limits
async function retryWithBackoff(operation, maxRetries = 5, initialDelay = 1000, maxDelay = 60000) {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      // Check if this is a quota exceeded error
      const isQuotaError = error.message && (
        error.message.includes('Quota exceeded') ||
        error.message.includes('Rate limit exceeded') ||
        error.message.includes('User rate limit exceeded')
      );
      
      // If we've reached max retries or it's not a quota error, throw the error
      if (retries >= maxRetries || !isQuotaError) {
        throw error;
      }
      
      // Log the retry attempt
      logger.info(`API quota exceeded. Retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
      
      // Wait for the delay period
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase retries and apply exponential backoff with jitter
      retries++;
      delay = Math.min(delay * 2 * (0.9 + Math.random() * 0.2), maxDelay);
    }
  }
}

// Initialize ID generator with highest existing IDs from database
async function initializeIdGenerator() {
  try {
    logger.info('Initializing ID generator from database...');
    
    // Fetch all sheets data in parallel to find highest IDs
    const [
      studentRows, 
      classRows, 
      lectureRows, 
      attendanceRows, 
      homeworkRows, 
      examRows, 
      problemRows, 
      examProblemRows, 
      scoreRows,
      enrollmentRows
    ] = await Promise.all([
      fetchSheetData(sheetsRange.student),
      fetchSheetData(sheetsRange.class),
      fetchSheetData(sheetsRange.lecture),
      fetchSheetData(sheetsRange.attendance),
      fetchSheetData(sheetsRange.homework),
      fetchSheetData(sheetsRange.exam),
      fetchSheetData(sheetsRange.problem),
      fetchSheetData(sheetsRange.exam_problem),
      fetchSheetData(sheetsRange.score),
      fetchSheetData(sheetsRange.enrollment)
    ]);
    
    // Extract highest ID numbers for each prefix
    const maxIds = {
      S: findHighestIdNumber(studentRows, 'S'),
      C: findHighestIdNumber(classRows, 'C'),
      L: findHighestIdNumber(lectureRows, 'L'),
      AT: findHighestIdNumber(attendanceRows, 'AT'),
      HW: findHighestIdNumber(homeworkRows, 'HW'),
      E: findHighestIdNumber(examRows, 'E'),
      P: findHighestIdNumber(problemRows, 'P'),
      EP: findHighestIdNumber(examProblemRows, 'EP'),
      SC: findHighestIdNumber(scoreRows, 'SC'),
      EN: findHighestIdNumber(enrollmentRows, 'EN')
    };
    
    // Initialize the ID generator with the highest IDs
    DataUtils.IdGenerator.initializeFromDb(maxIds);
    
    logger.info('ID generator initialized successfully', { maxIds });
  } catch (error) {
    logger.error('Error initializing ID generator:', error);
  }
}

// Helper function to find the highest ID number for a given prefix
function findHighestIdNumber(rows, prefix) {
  let highestNum = 0;
  
  if (!rows || !rows.length) return highestNum;
  
  // Extract numeric part from IDs and find highest
  rows.forEach(row => {
    if (row && row[0] && row[0].startsWith(prefix)) {
      const numPart = row[0].substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > highestNum) {
        highestNum = num;
      }
    }
  });
  
  return highestNum;
}

// Delay server startup until Google APIs are initialized
async function initializeServer() {
  try {
    await initializeGoogleAPIs();
    
    // Initialize ID generator from database after Google APIs are ready
    await initializeIdGenerator();
    
    app.listen(PORT, () => {
      logger.info(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the initialization process
initializeServer();

// Analytics endpoints
app.get('/analytics/summary', async (req, res) => {
  try {
    // Get query parameters
    const { scope, timeFrame, classId, studentId, schoolId, generationId, dateFrom, dateTo } = req.query;
    
    // Fetch data from Google Sheets
    const [studentRows, attendanceRows, examRows, scoreRows, homeworkRows, classRows] = await Promise.all([
      fetchSheetData(sheetsRange.student),
      fetchSheetData(sheetsRange.attendance),
      fetchSheetData(sheetsRange.exam),
      fetchSheetData(sheetsRange.score),
      fetchSheetData(sheetsRange.homework),
      fetchSheetData(sheetsRange.class)
    ]);
    
    // Filter data based on scope and time frame
    let filteredStudents = [...studentRows];
    let filteredAttendance = [...attendanceRows];
    let filteredScores = [...scoreRows];
    let filteredHomework = [...homeworkRows];
    
    // Apply filters based on scope
    if (scope === 'by-class' && classId && classId !== 'all') {
      // Get enrollments for this class
      const enrollmentsRows = await fetchSheetData(sheetsRange.enrollment);
      const classEnrollments = enrollmentsRows.filter(row => row[2] === classId);
      const enrolledStudentIds = classEnrollments.map(row => row[1]);
      
      // Filter students
      filteredStudents = filteredStudents.filter(row => enrolledStudentIds.includes(row[0]));
      
      // Filter lectures for this class
      const lectureRows = await fetchSheetData(sheetsRange.lecture);
      const classLectures = lectureRows.filter(row => row[1] === classId);
      const lecturesToInclude = classLectures.map(row => row[0]);
      
      // Filter attendance records
      filteredAttendance = filteredAttendance.filter(row => lecturesToInclude.includes(row[1]));
      
      // Filter homework records
      filteredHomework = filteredHomework.filter(row => lecturesToInclude.includes(row[1]));
      
      // Filter exams and scores
      const classExams = examRows.filter(row => row[3] === classId);
      const examIdsToInclude = classExams.map(row => row[0]);
      filteredScores = filteredScores.filter(row => examIdsToInclude.includes(row[1]));
    } else if (scope === 'by-student' && studentId && studentId !== 'all') {
      // Filter by student
      filteredStudents = filteredStudents.filter(row => row[0] === studentId);
      filteredAttendance = filteredAttendance.filter(row => row[2] === studentId);
      filteredScores = filteredScores.filter(row => row[2] === studentId);
      filteredHomework = filteredHomework.filter(row => row[2] === studentId);
    } else if (scope === 'by-school' && schoolId && schoolId !== 'all') {
      // Filter students by school
      filteredStudents = filteredStudents.filter(row => row[2] === schoolId);
      
      // Get IDs of filtered students
      const studentIds = filteredStudents.map(row => row[0]);
      
      // Filter other data by these student IDs
      filteredAttendance = filteredAttendance.filter(row => studentIds.includes(row[2]));
      filteredScores = filteredScores.filter(row => studentIds.includes(row[2]));
      filteredHomework = filteredHomework.filter(row => studentIds.includes(row[2]));
    } else if (scope === 'by-generation' && generationId && generationId !== 'all') {
      // Filter students by generation
      filteredStudents = filteredStudents.filter(row => row[3] === generationId);
      
      // Get IDs of filtered students
      const studentIds = filteredStudents.map(row => row[0]);
      
      // Filter other data by these student IDs
      filteredAttendance = filteredAttendance.filter(row => studentIds.includes(row[2]));
      filteredScores = filteredScores.filter(row => studentIds.includes(row[2]));
      filteredHomework = filteredHomework.filter(row => studentIds.includes(row[2]));
    }
    
    // Apply date filters if custom date range is provided
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      // Get lectures within the date range
      const lectureRows = await fetchSheetData(sheetsRange.lecture);
      const lecturesInRange = lectureRows.filter(row => {
        const lectureDate = new Date(row[2]);
        return lectureDate >= fromDate && lectureDate <= toDate;
      });
      
      const lectureIdsInRange = lecturesInRange.map(row => row[0]);
      
      // Filter attendance and homework by lecture dates
      filteredAttendance = filteredAttendance.filter(row => lectureIdsInRange.includes(row[1]));
      filteredHomework = filteredHomework.filter(row => lectureIdsInRange.includes(row[1]));
    }
    
    // Calculate summary statistics
    
    // Student stats
    const totalStudents = filteredStudents.length;
    const activeStudents = filteredStudents.filter(row => row[6] === 'active').length;
    
    // Calculate recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const enrollmentRows = await fetchSheetData(sheetsRange.enrollment);
    const filteredEnrollments = enrollmentRows.filter(row => {
      try {
        const enrollmentDate = new Date(row[3]);
        return enrollmentDate >= thirtyDaysAgo;
      } catch (e) {
        return false;
      }
    });
    const recentEnrollments = filteredEnrollments.length;
    
    // Attendance stats
    let attendanceRate = 0;
    let attendanceComparison = 0;
    if (filteredAttendance.length > 0) {
      const attendedCount = filteredAttendance.filter(row => row[3] === 'present').length;
      attendanceRate = Math.round((attendedCount / filteredAttendance.length) * 100);
      
      // Compare to overall average
      const allAttendedCount = attendanceRows.filter(row => row[3] === 'present').length;
      const overallAttendanceRate = (allAttendedCount / attendanceRows.length) * 100;
      attendanceComparison = Math.round(attendanceRate - overallAttendanceRate);
    }
    
    // Exam score stats
    let avgExamScore = 0;
    let scoreComparison = 0;
    if (filteredScores.length > 0) {
      // Calculate average score
      const totalScore = filteredScores.reduce((sum, row) => sum + (parseFloat(row[4]) || 0), 0);
      avgExamScore = Math.round((totalScore / filteredScores.length) * 100);
      
      // Calculate previous period for comparison
      const previousPeriodScores = scoreRows; // Simplified - in reality would filter by previous time period
      if (previousPeriodScores.length > 0) {
        const prevTotalScore = previousPeriodScores.reduce((sum, row) => sum + (parseFloat(row[4]) || 0), 0);
        const prevAvgScore = (prevTotalScore / previousPeriodScores.length) * 100;
        scoreComparison = Math.round(avgExamScore - prevAvgScore);
      }
    }
    
    // Homework completion stats
    let homeworkCompletionRate = 0;
    let homeworkComparison = 0;
    if (filteredHomework.length > 0) {
      const totalProblems = filteredHomework.reduce((sum, row) => sum + (parseInt(row[3]) || 0), 0);
      const completedProblems = filteredHomework.reduce((sum, row) => sum + (parseInt(row[4]) || 0), 0);
      
      if (totalProblems > 0) {
        homeworkCompletionRate = Math.round((completedProblems / totalProblems) * 100);
        
        // Compare to overall average
        const allTotalProblems = homeworkRows.reduce((sum, row) => sum + (parseInt(row[3]) || 0), 0);
        const allCompletedProblems = homeworkRows.reduce((sum, row) => sum + (parseInt(row[4]) || 0), 0);
        
        if (allTotalProblems > 0) {
          const overallCompletionRate = (allCompletedProblems / allTotalProblems) * 100;
          homeworkComparison = Math.round(homeworkCompletionRate - overallCompletionRate);
        }
      }
    }
    
    // Build the summary response
    const summary = {
      students: {
        total: totalStudents,
        active: activeStudents,
        newEnrollments: recentEnrollments
      },
      attendance: {
        rate: attendanceRate,
        comparison: attendanceComparison
      },
      performance: {
        averageScore: avgExamScore,
        comparison: scoreComparison
      },
      homework: {
        completionRate: homeworkCompletionRate,
        comparison: homeworkComparison
      }
    };
    
    res.status(200).json({ success: true, summary });
    
  } catch (err) {
    logger.error('Error generating analytics summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Attendance analytics endpoint
app.get('/analytics/attendance', async (req, res) => {
  try {
    // Get query parameters
    const { scope, classId, studentId, dateFrom, dateTo } = req.query;
    
    // Fetch required data
    const [attendanceRows, lectureRows, studentRows] = await Promise.all([
      fetchSheetData(sheetsRange.attendance),
      fetchSheetData(sheetsRange.lecture),
      fetchSheetData(sheetsRange.student)
    ]);
    
    // Filter by scope and date range
    let filteredAttendance = [...attendanceRows];
    let filteredLectures = [...lectureRows];
    let filteredStudents = [...studentRows];
    
    // Apply the same filtering logic as in the summary endpoint
    // ... (similar filtering logic as in summary endpoint)
    
    // Calculate attendance patterns over time
    const lecturesByWeek = {};
    filteredLectures.forEach(lecture => {
      try {
        const lectureDate = new Date(lecture[2]);
        const weekStart = new Date(lectureDate);
        weekStart.setDate(lectureDate.getDate() - lectureDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!lecturesByWeek[weekKey]) {
          lecturesByWeek[weekKey] = [];
        }
        lecturesByWeek[weekKey].push(lecture[0]); // Add lecture ID
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    // Calculate attendance rates by week
    const attendanceByWeek = {};
    Object.keys(lecturesByWeek).sort().forEach(weekKey => {
      const weekLectures = lecturesByWeek[weekKey];
      const weekAttendance = filteredAttendance.filter(att => weekLectures.includes(att[1]));
      
      if (weekAttendance.length > 0) {
        const presentCount = weekAttendance.filter(att => att[3] === 'present').length;
        const weekRate = Math.round((presentCount / weekAttendance.length) * 100);
        attendanceByWeek[weekKey] = weekRate;
      }
    });
    
    // Calculate attendance by day of week
    const attendanceByDay = {
      Monday: { total: 0, present: 0, rate: 0 },
      Tuesday: { total: 0, present: 0, rate: 0 },
      Wednesday: { total: 0, present: 0, rate: 0 },
      Thursday: { total: 0, present: 0, rate: 0 },
      Friday: { total: 0, present: 0, rate: 0 }
    };
    
    // Map lectures to days
    const lectureDayMap = {};
    filteredLectures.forEach(lecture => {
      try {
        const lectureDate = new Date(lecture[2]);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[lectureDate.getDay()];
        if (dayName !== 'Sunday' && dayName !== 'Saturday') { // Skip weekends if not needed
          lectureDayMap[lecture[0]] = dayName;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    // Calculate attendance by day
    filteredAttendance.forEach(att => {
      const lectureId = att[1];
      const dayName = lectureDayMap[lectureId];
      
      if (dayName && attendanceByDay[dayName]) {
        attendanceByDay[dayName].total++;
        if (att[3] === 'present') {
          attendanceByDay[dayName].present++;
        }
      }
    });
    
    // Calculate rates
    Object.keys(attendanceByDay).forEach(day => {
      const dayData = attendanceByDay[day];
      if (dayData.total > 0) {
        dayData.rate = Math.round((dayData.present / dayData.total) * 100);
      }
    });
    
    // Find students with low attendance
    const studentAttendance = {};
    filteredAttendance.forEach(att => {
      const studentId = att[2];
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = { total: 0, present: 0, pattern: {} };
      }
      
      studentAttendance[studentId].total++;
      if (att[3] === 'present') {
        studentAttendance[studentId].present++;
      }
      
      // Track attendance patterns by day
      const lectureId = att[1];
      const dayName = lectureDayMap[lectureId];
      if (dayName) {
        if (!studentAttendance[studentId].pattern[dayName]) {
          studentAttendance[studentId].pattern[dayName] = { total: 0, absent: 0 };
        }
        studentAttendance[studentId].pattern[dayName].total++;
        if (att[3] !== 'present') {
          studentAttendance[studentId].pattern[dayName].absent++;
        }
      }
    });
    
    // Calculate rates and identify patterns
    Object.keys(studentAttendance).forEach(studentId => {
      const data = studentAttendance[studentId];
      if (data.total > 0) {
        data.rate = Math.round((data.present / data.total) * 100);
        data.missed = data.total - data.present;
        
        // Determine attendance pattern
        let worstDay = null;
        let worstDayAbsentRate = 0;
        let hasPattern = false;
        
        Object.keys(data.pattern).forEach(day => {
          const dayPattern = data.pattern[day];
          if (dayPattern.total > 0) {
            const absentRate = dayPattern.absent / dayPattern.total;
            if (absentRate > worstDayAbsentRate && absentRate > 0.5) { // More than 50% absences on this day
              worstDay = day;
              worstDayAbsentRate = absentRate;
              hasPattern = true;
            }
          }
        });
        
        data.patternDescription = hasPattern ? 
          `${worstDay} absences (${Math.round(worstDayAbsentRate * 100)}%)` : 
          'Random pattern';
      }
    });
    
    // Get student names and low performers
    const lowAttendanceThreshold = 75; // Configurable threshold
    const studentsWithLowAttendance = Object.keys(studentAttendance)
      .filter(studentId => {
        const data = studentAttendance[studentId];
        return data.total > 0 && data.rate < lowAttendanceThreshold;
      })
      .map(studentId => {
        const studentData = filteredStudents.find(s => s[0] === studentId);
        const attendanceData = studentAttendance[studentId];
        
        return {
          id: studentId,
          name: studentData ? studentData[1] : 'Unknown',
          class: 'Multiple Classes', // In a real implementation, would look up class name
          rate: attendanceData.rate,
          missed: attendanceData.missed,
          pattern: attendanceData.patternDescription
        };
      })
      .sort((a, b) => a.rate - b.rate) // Sort by attendance rate (lowest first)
      .slice(0, 10); // Take top 10 worst attendance
    
    // Build the attendance analytics response
    const attendanceAnalytics = {
      patterns: {
        labels: Object.keys(attendanceByWeek),
        data: Object.values(attendanceByWeek)
      },
      byDay: {
        labels: Object.keys(attendanceByDay),
        data: Object.keys(attendanceByDay).map(day => attendanceByDay[day].rate)
      },
      distribution: {
        labels: ['90-100%', '80-89%', '70-79%', '60-69%', '<60%'],
        data: calculateAttendanceDistribution(studentAttendance)
      },
      lowAttendanceStudents: studentsWithLowAttendance
    };
    
    res.status(200).json({ success: true, attendanceAnalytics });
    
  } catch (err) {
    logger.error('Error generating attendance analytics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Performance analytics endpoint
app.get('/analytics/performance', async (req, res) => {
  try {
    // Get query parameters
    const { scope, classId, studentId, dateFrom, dateTo } = req.query;
    
    // Fetch required data
    const [scoreRows, examRows, examProblemRows, studentRows] = await Promise.all([
      fetchSheetData(sheetsRange.score),
      fetchSheetData(sheetsRange.exam),
      fetchSheetData(sheetsRange.exam_problem),
      fetchSheetData(sheetsRange.student)
    ]);
    
    // Filter by scope and other criteria
    // ... (similar filtering logic)
    
    // Calculate grade distribution
    const scores = scoreRows.map(row => parseFloat(row[4]) || 0);
    const gradeDistribution = calculateGradeDistribution(scores);
    
    // Extract problems by subject
    const problemsByExam = {};
    examProblemRows.forEach(row => {
      const examId = row[1];
      const problemId = row[2];
      
      if (!problemsByExam[examId]) {
        problemsByExam[examId] = [];
      }
      
      problemsByExam[examId].push(problemId);
    });
    
    // Calculate performance by subject (simplified - in real app would categorize by subject)
    const examSubjects = {};
    examRows.forEach(exam => {
      const examId = exam[0];
      const title = exam[1];
      
      // Simplified: derive subject from exam title
      let subject = 'Other';
      if (title) {
        if (title.toLowerCase().includes('math')) subject = 'Mathematics';
        else if (title.toLowerCase().includes('science')) subject = 'Science';
        else if (title.toLowerCase().includes('english')) subject = 'English';
        else if (title.toLowerCase().includes('social') || title.toLowerCase().includes('history')) subject = 'Social Studies';
        else if (title.toLowerCase().includes('art')) subject = 'Arts';
      }
      
      examSubjects[examId] = subject;
    });
    
    // Calculate average score by subject
    const subjectScores = {
      'Mathematics': { total: 0, count: 0 },
      'Science': { total: 0, count: 0 },
      'English': { total: 0, count: 0 },
      'Social Studies': { total: 0, count: 0 },
      'Arts': { total: 0, count: 0 }
    };
    
    scoreRows.forEach(score => {
      const examId = score[1];
      const subject = examSubjects[examId] || 'Other';
      const scoreValue = parseFloat(score[4]) || 0;
      
      if (subjectScores[subject]) {
        subjectScores[subject].total += scoreValue;
        subjectScores[subject].count++;
      }
    });
    
    const subjectPerformance = {
      labels: Object.keys(subjectScores),
      data: Object.keys(subjectScores).map(subject => {
        const data = subjectScores[subject];
        return data.count > 0 ? Math.round((data.total / data.count) * 100) : 0;
      })
    };
    
    // Calculate correlation between attendance and performance
    const attendanceRows = await fetchSheetData(sheetsRange.attendance);
    const performanceAttendanceCorrelation = [];
    
    // Get student IDs who have both scores and attendance records
    const studentIdsWithScores = [...new Set(scoreRows.map(row => row[2]))];
    
    studentIdsWithScores.forEach(studentId => {
      const studentScores = scoreRows.filter(row => row[2] === studentId);
      const studentAttendance = attendanceRows.filter(row => row[2] === studentId);
      
      if (studentScores.length > 0 && studentAttendance.length > 0) {
        // Calculate average score
        const totalScore = studentScores.reduce((sum, row) => sum + (parseFloat(row[4]) || 0), 0);
        const avgScore = (totalScore / studentScores.length) * 100;
        
        // Calculate attendance rate
        const presentCount = studentAttendance.filter(att => att[3] === 'present').length;
        const attendanceRate = (presentCount / studentAttendance.length) * 100;
        
        performanceAttendanceCorrelation.push({
          x: attendanceRate,
          y: avgScore
        });
      }
    });
    
    // Find top performing students
    const studentPerformance = {};
    scoreRows.forEach(score => {
      const studentId = score[2];
      const examId = score[1];
      const scoreValue = parseFloat(score[4]) || 0;
      const subject = examSubjects[examId] || 'Other';
      
      if (!studentPerformance[studentId]) {
        studentPerformance[studentId] = {
          totalScore: 0,
          count: 0,
          bySubject: {}
        };
      }
      
      studentPerformance[studentId].totalScore += scoreValue;
      studentPerformance[studentId].count++;
      
      if (!studentPerformance[studentId].bySubject[subject]) {
        studentPerformance[studentId].bySubject[subject] = {
          total: 0,
          count: 0
        };
      }
      
      studentPerformance[studentId].bySubject[subject].total += scoreValue;
      studentPerformance[studentId].bySubject[subject].count++;
    });
    
    // Calculate averages and best subjects
    Object.keys(studentPerformance).forEach(studentId => {
      const data = studentPerformance[studentId];
      
      if (data.count > 0) {
        data.average = (data.totalScore / data.count) * 100;
        
        // Find best subject
        let bestSubject = null;
        let bestSubjectAvg = 0;
        
        Object.keys(data.bySubject).forEach(subject => {
          const subjectData = data.bySubject[subject];
          if (subjectData.count > 0) {
            const subjectAvg = subjectData.total / subjectData.count;
            if (subjectAvg > bestSubjectAvg) {
              bestSubject = subject;
              bestSubjectAvg = subjectAvg;
            }
          }
        });
        
        data.bestSubject = bestSubject || 'None';
      }
    });
    
    // Get top performers
    const topPerformers = Object.keys(studentPerformance)
      .filter(studentId => {
        const data = studentPerformance[studentId];
        return data.count >= 3; // At least 3 scores to be considered
      })
      .map(studentId => {
        const studentData = studentRows.find(s => s[0] === studentId);
        const perfData = studentPerformance[studentId];
        
        // Find class (simplified)
        const classId = "Unknown"; // In a real implementation, would determine primary class
        
        return {
          id: studentId,
          name: studentData ? studentData[1] : 'Unknown',
          class: classId,
          average: Math.round(perfData.average),
          bestSubject: perfData.bestSubject
        };
      })
      .sort((a, b) => b.average - a.average) // Sort by average (highest first)
      .slice(0, 10); // Top 10 performers
    
    // Build the performance analytics response
    const performanceAnalytics = {
      gradeDistribution: {
        labels: gradeDistribution.labels,
        data: gradeDistribution.data
      },
      subjectPerformance: subjectPerformance,
      performanceAttendance: performanceAttendanceCorrelation,
      topPerformers: topPerformers
    };
    
    res.status(200).json({ success: true, performanceAnalytics });
    
  } catch (err) {
    logger.error('Error generating performance analytics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper function to calculate attendance distribution
function calculateAttendanceDistribution(studentAttendance) {
  const distribution = [0, 0, 0, 0, 0]; // [90-100%, 80-89%, 70-79%, 60-69%, <60%]
  
  Object.values(studentAttendance).forEach(data => {
    if (data.total > 0) {
      const rate = data.rate;
      
      if (rate >= 90) distribution[0]++;
      else if (rate >= 80) distribution[1]++;
      else if (rate >= 70) distribution[2]++;
      else if (rate >= 60) distribution[3]++;
      else distribution[4]++;
    }
  });
  
  return distribution;
}

// Helper function to calculate grade distribution
function calculateGradeDistribution(scores) {
  const distribution = [0, 0, 0, 0, 0]; // [A, B, C, D, F]
  
  scores.forEach(score => {
    const percentage = score * 100;
    
    if (percentage >= 90) distribution[0]++;
    else if (percentage >= 80) distribution[1]++;
    else if (percentage >= 70) distribution[2]++;
    else if (percentage >= 60) distribution[3]++;
    else distribution[4]++;
  });
  
  return {
    labels: ['A', 'B', 'C', 'D', 'F'],
    data: distribution
  };
}