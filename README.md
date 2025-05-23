# BrainDB - Educational Database System

BrainDB is a comprehensive educational database system designed to help educational institutions manage students, classes, lectures, exams, attendance, and more. The application connects to Google Sheets as its backend database.

## Features

- Student management (add, view, update, delete)
- Class management with enrollment tracking
- Lecture scheduling and attendance monitoring
- Comprehensive homework and assignment tracking
- Exam creation and grading system
- Performance analytics and reporting
- Modular and maintainable architecture

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript with modular component system
- **Backend**: Node.js, Express with MVC architecture
- **Database**: Google Sheets API with repository pattern
- **Authentication**: Google OAuth 2.0
- **Logging**: Winston for structured logging

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or later)
- npm (v6 or later)
- Google Cloud Platform account with Google Sheets API enabled

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/brain-db.git
   cd brain-db
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Sheets API Credentials**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Sheets API and Google Drive API
   - Create service account credentials
   - Download the JSON key file and rename it to `credential.json`
   - Place the `credential.json` file in the root directory of the project

4. **Configure the Google Sheet**
   - Create a new Google Sheet
   - Share the sheet with the email address from your service account (with editor permissions)
   - Copy the spreadsheet ID (from the URL) and update the `spreadsheetId` in `src/config/database.config.js`
   - Create the following sheets in your spreadsheet:
     - students
     - class
     - lecture
     - enrollment
     - attendance
     - homework
     - exam
     - problem_id
     - exam_problem
     - score

5. **Configure application settings**
   - Review and update settings in `src/config/app.config.js`

6. **Start the application**
   ```bash
   npm start
   ```

7. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
brain-db/
├── app.js                   # Main server entry point
├── server.js                # Server bootstrap script
├── package.json             # Project dependencies and scripts
├── credential.json          # Google API credentials (not included in repo)
├── docs/                    # Project documentation
│   ├── repository-system.md # Documentation for repository system
│   └── modularization-guide.md # Guide for frontend modularization
├── public/                  # Frontend static files
│   ├── index.html           # Main HTML file
│   ├── index.js             # Frontend entry point
│   ├── css/                 # CSS modules and styles
│   │   ├── main.css         # Main CSS file
│   │   ├── base/            # Base styles and themes
│   │   ├── components/      # Component-specific styles
│   │   └── layouts/         # Layout styles
│   ├── js/                  # Frontend JavaScript
│   │   ├── core/            # Core modules and base classes
│   │   ├── modules/         # Feature modules 
│   │   └── services/        # Frontend services
│   ├── templates/           # HTML templates for components
│   └── menu-content/        # Legacy page content
├── src/                     # Backend source code
│   ├── api/                 # API routes
│   ├── config/              # Application configuration
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── models/              # Data repositories
│   └── services/            # Backend services
```

## API Endpoints

BrainDB provides a comprehensive RESTful API:

- **/api/students** - Student management
- **/api/classes** - Class management
- **/api/lectures** - Lecture management
- **/api/attendance** - Attendance tracking
- **/api/homework** - Homework management
- **/api/exams** - Exam management
- **/api/scores** - Score management
- **/api/enrollment** - Enrollment management
- **/api/analytics** - Analytics and reports

See API documentation in `/api` endpoint when the server is running.

## Architecture

BrainDB follows a clean, layered architecture:

1. **Repository Layer** - Handles data access with the repository pattern
2. **Service Layer** - Implements business logic and shared services
3. **Controller Layer** - Handles HTTP requests and responses
4. **Route Layer** - Defines API endpoints and routes
5. **Frontend Layer** - Implements UI with modular components

For more details, see the documentation in the `docs/` directory.

## Development

For development with automatic server restarts:

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.