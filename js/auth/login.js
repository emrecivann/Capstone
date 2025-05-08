// Handle form submission
const handleLogin = (event) =>
{
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorMessage = document.getElementById('errorMessage');

    // Basic validation¨
    if (!userId || !password || !role)
    {
        showError('Please fill in all fields');
        return false;
    }

    // Check if it's a supervisor login
    if (role === 'supervisor' && userId === 'admin' && password === 'admin')
    {
        window.location.href = '../../views/supervisor/supervisor-select-line.html';
        return false;
    }

    // For employees, check if ID matches pattern (M1D001, M2D001, etc.)
    const workerIdPattern = /^M[1-5]D\d{3}$/;
    
    if (role === 'employee' && workerIdPattern.test(userId) && password === 'metro123')
    {
        // Store the worker's ID and metro line in sessionStorage for later use
        sessionStorage.setItem('workerId', userId);
        sessionStorage.setItem('metroLine', userId.substring(0, 2)); // Store M1, M2, etc.
        
        window.location.href = '../../views/employee/employee-schedule.html';
        return false;
    }

    showError('Invalid credentials');
    return false;
};

// Show error message
const showError = (message) =>
{
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    // Hide error after 3 seconds
    setTimeout(() =>
    {
        errorMessage.style.display = 'none';
    }, 3000);
};
