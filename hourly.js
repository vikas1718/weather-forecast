const OPENWEATHER_API_KEY = '393b711701f817cf811e5a84e98047ca';

// Hourly Forecast Page JavaScript
let isCelsius = true;
let currentCity = '';

// DOM Elements
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const themeToggle = document.getElementById('themeToggle');
const cityDisplay = document.getElementById('cityDisplay');
const hourlyLoadingSpinner = document.getElementById('hourlyLoadingSpinner');
const hourlyCardsContainer = document.getElementById('hourlyCardsContainer');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Get city from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentCity = urlParams.get('city') || 'London';

    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Load temperature unit preference
    isCelsius = localStorage.getItem('temperatureUnit') !== 'fahrenheit';
    updateUnitButtons();

    // Load data
    loadHourlyData();

    // Event listeners
    celsiusBtn.addEventListener('click', () => {
        isCelsius = true;
        localStorage.setItem('temperatureUnit', 'celsius');
        updateUnitButtons();
        loadHourlyData();
    });

    fahrenheitBtn.addEventListener('click', () => {
        isCelsius = false;
        localStorage.setItem('temperatureUnit', 'fahrenheit');
        updateUnitButtons();
        loadHourlyData();
    });

    themeToggle.addEventListener('click', toggleTheme);

    // Close modal when clicking outside or on close button
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal || e.target.classList.contains('modal-close')) {
            errorModal.classList.remove('show');
        }
    });
});

function updateUnitButtons() {
    celsiusBtn.classList.toggle('active', isCelsius);
    fahrenheitBtn.classList.toggle('active', !isCelsius);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

async function loadHourlyData() {
    try {
        hourlyLoadingSpinner.classList.add('show');
        hourlyCardsContainer.innerHTML = '';

        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(currentCity)}&appid=${OPENWEATHER_API_KEY}&units=metric`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch hourly data');
        }

        const hourlyList = data.list.slice(0, 12).map(item => ({
            datetime: item.dt_txt,
            timestamp: item.dt,
            temperature: {
                celsius: Math.round(item.main.temp * 10) / 10,
                fahrenheit: Math.round((item.main.temp * 9/5 + 32) * 10) / 10
            },
            humidity: item.main.humidity,
            description: item.weather[0].description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            icon: item.weather[0].icon,
            wind_speed: item.wind.speed,
            precipitation: (item.rain ? item.rain['3h'] || 0 : 0) + (item.snow ? item.snow['3h'] || 0 : 0)
        }));

        const formattedData = {
            city: data.city.name,
            country: data.city.country,
            hourly: hourlyList
        };

        displayHourly(formattedData);
        updateCityDisplay(formattedData);

    } catch (error) {
        console.error('Error loading hourly data:', error);
        showError('Failed to load hourly forecast. Please try again.');
    } finally {
        hourlyLoadingSpinner.classList.remove('show');
    }
}

function updateCityDisplay(data) {
    cityDisplay.textContent = `${data.city}, ${data.country}`;
}

function displayHourly(data) {
    hourlyCardsContainer.innerHTML = '';

    data.hourly.forEach((hour, index) => {
        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.style.animationDelay = `${index * 0.05}s`;

        const datetime = new Date(hour.datetime);
        const time = datetime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        });

        const temp = isCelsius ? hour.temperature.celsius : hour.temperature.fahrenheit;
        const unit = isCelsius ? '°C' : '°F';

        // Format precipitation
        let precipText = '';
        if (hour.precipitation > 0) {
            precipText = `${hour.precipitation.toFixed(1)}mm`;
        }

        card.innerHTML = `
            <div class="hourly-time">${time}</div>
            <img class="hourly-icon" src="https://openweathermap.org/img/wn/${hour.icon}@2x.png" alt="${hour.description}">
            <div class="hourly-temp">${temp}${unit}</div>
            <div class="hourly-desc">${hour.description}</div>
            <div class="hourly-details">
                <div>💧 ${hour.humidity}%</div>
                <div>💨 ${hour.wind_speed} m/s</div>
                ${precipText ? `<div>🌧️ ${precipText}</div>` : ''}
            </div>
        `;

        hourlyCardsContainer.appendChild(card);
    });
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.add('show');
}