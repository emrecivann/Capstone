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

    // TODO: In the future, this will be replaced with actual backend authentication
    if (userId === 'admin' && password === ' ')
    {
        // Redirect based on role
        if (role === 'supervisor')
        {
            window.location.href = 'supervisor-select-line.html';
        } else
        {
            window.location.href = 'employee-schedule.html';
        }
    } else
    {
        showError('Invalid credentials');
    }

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
