// Connect to MongoDB data (you'll need to set up an API endpoint)
const API_URL = "mongodb+srv://benmross08:Rose7714@studentdata.fmx8b.mongodb.net/?retryWrites=true&w=majority&appName=StudentData";

// DOM Elements
const studentSelect = document.getElementById('student-select');
const dateStart = document.getElementById('date-start');
const dateEnd = document.getElementById('date-end');
const applyFiltersBtn = document.getElementById('apply-filters');
const moodContainer = document.getElementById('mood-data');

// Initialize the dashboard
async function initializeDashboard() {
    try {
        // Fetch and populate student list
        const students = await fetchStudents();
        populateStudentSelect(students);
        
        // Load initial data
        await fetchAndDisplayMoodData();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
}

// Fetch mood data based on filters
async function fetchAndDisplayMoodData() {
    const filters = {
        student: studentSelect.value,
        startDate: dateStart.value,
        endDate: dateEnd.value
    };

    try {
        const response = await fetch(API_URL + constructQueryString(filters));
        const data = await response.json();
        displayMoodData(data);
    } catch (error) {
        console.error('Failed to fetch mood data:', error);
    }
}

// Helper function to construct query string from filters
function constructQueryString(filters) {
    const params = new URLSearchParams();
    if (filters.student) params.append('studentId', filters.student);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return '?' + params.toString();
}

// Fetch list of students from the database
async function fetchStudents() {
    try {
        const response = await fetch(`${API_URL}/students`);
        const students = await response.json();
        return students;
    } catch (error) {
        console.error('Failed to fetch students:', error);
        return [];
    }
}

// Populate the student dropdown with fetched students
function populateStudentSelect(students) {
    // Keep the "All Students" option
    studentSelect.innerHTML = '<option value="">All Students</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.studentId;
        option.textContent = `${student.firstName} ${student.lastName}`;
        studentSelect.appendChild(option);
    });
}

// Display mood data in the container
function displayMoodData(data) {
    moodContainer.innerHTML = ''; // Clear existing content
    
    if (!data || data.length === 0) {
        moodContainer.innerHTML = '<p>No mood data available for the selected filters.</p>';
        return;
    }

    // Create a table to display the mood data
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Mood</th>
                <th>Score</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(entry => {
        const row = document.createElement('tr');
        const date = new Date(entry.timestamp).toLocaleDateString();
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${entry.studentName}</td>
            <td>${entry.moodLabel}</td>
            <td>${entry.moodScore}/5</td>
            <td>${entry.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    moodContainer.appendChild(table);

    // Add a simple visualization (bar chart showing average mood by day)
    createMoodChart(data);
}

// Create a simple visualization of mood data
function createMoodChart(data) {
    // Group data by date and calculate average mood
    const dailyAverages = {};
    data.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        if (!dailyAverages[date]) {
            dailyAverages[date] = { sum: 0, count: 0 };
        }
        dailyAverages[date].sum += entry.moodScore;
        dailyAverages[date].count += 1;
    });

    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'mood-chart';
    chartContainer.innerHTML = '<h3>Daily Mood Averages</h3>';

    // Create bar chart
    const chart = document.createElement('div');
    chart.className = 'chart';

    Object.entries(dailyAverages).forEach(([date, data]) => {
        const average = data.sum / data.count;
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${average * 20}px`; // Scale height by mood score
        bar.title = `${date}: ${average.toFixed(1)}/5`;
        chart.appendChild(bar);
    });

    chartContainer.appendChild(chart);
    moodContainer.appendChild(chartContainer);
}

// Event Listeners
applyFiltersBtn.addEventListener('click', fetchAndDisplayMoodData);

// Initialize the dashboard when the page loads
initializeDashboard(); 