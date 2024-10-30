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

// Display mood data in the container
function displayMoodData(data) {
    moodContainer.innerHTML = ''; // Clear existing content
    
    // Create visualization of mood data
    // This is where you'll add your specific visualization logic
}

// Event Listeners
applyFiltersBtn.addEventListener('click', fetchAndDisplayMoodData);

// Initialize the dashboard when the page loads
initializeDashboard(); 