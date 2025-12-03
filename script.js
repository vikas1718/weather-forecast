const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherDisplay = document.getElementById('weatherDisplay');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const themeToggle = document.getElementById('themeToggle');
const citySuggestions = document.getElementById('citySuggestions');
const forecastBtn = document.getElementById('forecastBtn');
const hourlyBtn = document.getElementById('hourlyBtn');
const currentWeatherView = document.getElementById('currentWeatherView');
const forecastView = document.getElementById('forecastView');
const backBtn = document.getElementById('backBtn');
const forecastCardsContainer = document.getElementById('forecastCardsContainer');
const forecastLoadingSpinner = document.getElementById('forecastLoadingSpinner');
const forecastCityName = document.getElementById('forecastCityName');
const hourlyView = document.getElementById('hourlyView');
const hourlyBackBtn = document.getElementById('hourlyBackBtn');
const hourlyCardsContainer = document.getElementById('hourlyCardsContainer');
const hourlyLoadingSpinner = document.getElementById('hourlyLoadingSpinner');
const hourlyCityName = document.getElementById('hourlyCityName');

// New elements for enhanced features
const favoriteBtn = document.getElementById('favoriteBtn');
const favoritesToggle = document.getElementById('favoritesToggle');
const favoritesSidebar = document.getElementById('favoritesSidebar');
const favoritesOverlay = document.getElementById('favoritesOverlay');
const closeFavoritesBtn = document.getElementById('closeFavoritesBtn');
const favoritesList = document.getElementById('favoritesList');
const uvIndex = document.getElementById('uvIndex');
const aqi = document.getElementById('aqi');
const windArrow = document.getElementById('windArrow');



// New elements for advanced features
const skyBackground = document.getElementById('skyBackground');
const particlesContainer = document.getElementById('particlesContainer');
const feelsLikeTemp = document.getElementById('feelsLike');

let currentWeatherData = null;
let isCelsius = true;
let suggestionsTimeout = null;
let particles = [];
let currentWeatherCondition = 'clear';

const popularCities = [
    'London', 'New York', 'Tokyo', 'Paris', 'Dubai', 'Singapore', 
    'Sydney', 'Mumbai', 'Barcelona', 'Istanbul', 'Los Angeles', 
    'Chicago', 'Toronto', 'Berlin', 'Rome', 'Madrid', 'Amsterdam',
    'Bangkok', 'Hong Kong', 'Seoul', 'San Francisco', 'Miami',
    'Boston', 'Seattle', 'Las Vegas', 'Vancouver', 'Montreal'
];

function initTheme() {
    const savedTheme = localStorage.getItem('weatherAppTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

function updateSkyBackground(condition) {
    currentWeatherCondition = condition;
    skyBackground.className = 'sky-background';

    if (condition.includes('clear') || condition.includes('sun')) {
        skyBackground.classList.add('clear');
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
        skyBackground.classList.add('cloudy');
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
        skyBackground.classList.add('rainy');
        createRainParticles();
    } else if (condition.includes('snow')) {
        skyBackground.classList.add('snowy');
        createSnowParticles();
    } else {
        skyBackground.classList.add('clear');
    }
}

function createRainParticles() {
    clearParticles();
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle rain';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particlesContainer.appendChild(particle);
        particles.push(particle);
    }
}

function createSnowParticles() {
    clearParticles();
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle snow';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particlesContainer.appendChild(particle);
        particles.push(particle);
    }
}

function clearParticles() {
    particles.forEach(particle => particle.remove());
    particles = [];
}

function animateFeelsLikeTemperature(newTemp) {
    const currentTemp = feelsLikeTemp.textContent;
    const currentValue = parseFloat(currentTemp);
    const targetValue = parseFloat(newTemp);

    if (currentValue !== targetValue) {
        feelsLikeTemp.style.transform = 'scale(1.1)';
        feelsLikeTemp.style.color = '#667eea';

        setTimeout(() => {
            feelsLikeTemp.textContent = newTemp;
            feelsLikeTemp.style.transform = 'scale(1)';
            feelsLikeTemp.style.color = '';
        }, 300);
    } else {
        feelsLikeTemp.textContent = newTemp;
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('weatherAppTheme', isDark ? 'dark' : 'light');
}

function showCurrentWeatherView() {
    currentWeatherView.classList.remove('hide');
    currentWeatherView.classList.add('show');
    forecastView.classList.remove('show');
    forecastView.classList.add('hide');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading() {
    loadingSpinner.classList.add('show');
    weatherDisplay.classList.remove('show');
    weatherDisplay.classList.add('hide');
    hideError();
}

function hideLoading() {
    loadingSpinner.classList.remove('show');
    weatherDisplay.classList.remove('hide');
}

function hideSuggestions() {
    citySuggestions.classList.remove('show');
    citySuggestions.innerHTML = '';
}

async function showSuggestions(query) {
    if (!query || query.length < 2) {
        hideSuggestions();
        return;
    }

    try {
        const response = await fetch(`/api/city-suggestions?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok || !data.suggestions || data.suggestions.length === 0) {
            hideSuggestions();
            return;
        }

        citySuggestions.innerHTML = data.suggestions.map(suggestion => {
            const displayName = suggestion.state
                ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
                : `${suggestion.name}, ${suggestion.country}`;
            const regex = new RegExp(`(${query})`, 'gi');
            const highlighted = displayName.replace(regex, '<strong>$1</strong>');
            return `<div class="city-suggestion-item" data-city="${suggestion.name}">${highlighted}</div>`;
        }).join('');

        citySuggestions.classList.add('show');

        document.querySelectorAll('.city-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const city = item.getAttribute('data-city');
                cityInput.value = city;
                hideSuggestions();
                fetchWeather(city);
            });
        });
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        hideSuggestions();
    }
}

function updateTemperatureDisplay() {
    if (!currentWeatherData) return;

    const tempCelsius = document.getElementById('tempCelsius');

    if (isCelsius) {
        tempCelsius.textContent = `${currentWeatherData.temperature.celsius}°C`;
        animateFeelsLikeTemperature(`${currentWeatherData.feels_like.celsius}°C`);
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        tempCelsius.textContent = `${currentWeatherData.temperature.fahrenheit}°F`;
        animateFeelsLikeTemperature(`${currentWeatherData.feels_like.fahrenheit}°F`);
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
    }
}

function displayWeather(data) {
    currentWeatherData = data;
    console.log('displayWeather called with data:', data);

    document.getElementById('cityName').textContent = data.city;
    document.getElementById('country').textContent = data.country;
    document.getElementById('weatherDescription').textContent = data.description;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@4x.png`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind_speed} m/s`;
    document.getElementById('pressure').textContent = `${data.pressure} hPa`;

    // Update UV Index display
    if (data.uv_index) {
        uvIndex.textContent = `${data.uv_index.value} (${data.uv_index.category})`;
        uvIndex.style.color = data.uv_index.color;
    } else {
        uvIndex.textContent = 'N/A';
    }

    // Update wind direction compass
    if (data.wind_direction !== undefined) {
        windArrow.style.transform = `rotate(${data.wind_direction}deg)`;
    }

    // Update sky background and particles based on weather condition
    updateSkyBackground(data.description.toLowerCase());

    updateTemperatureDisplay();

    // Update favorite button state
    updateFavoriteButton();

    // Fetch and display bottom hourly forecast
    fetchBottomHourly(data.city);

    // Fetch AQI data
    if (data.coordinates) {
        fetchAQI(data.coordinates.lat, data.coordinates.lon);
    }

    hideLoading();
    weatherDisplay.classList.add('show');
}

function displayForecast(data) {
    forecastCardsContainer.innerHTML = '';
    forecastCityName.textContent = `5-Day Forecast - ${data.city}`;

    data.forecast.forEach((day, index) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const tempHigh = isCelsius ? day.temperature.max_celsius : day.temperature.max_fahrenheit;
        const tempLow = isCelsius ? day.temperature.min_celsius : day.temperature.min_fahrenheit;
        const unit = isCelsius ? '°C' : '°F';

        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date-text">${dateStr}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
            <div class="forecast-high">${tempHigh}${unit}</div>
            <div class="forecast-low">${tempLow}${unit}</div>
            <div class="forecast-desc">${day.description}</div>
        `;

        forecastCardsContainer.appendChild(card);
    });

    forecastLoadingSpinner.classList.remove('show');
    forecastView.classList.remove('hide');
    forecastView.classList.add('show');
}



function displayBottomHourly(data) {
    const bottomHourlyCards = document.getElementById('bottomHourlyCards');
    if (!bottomHourlyCards) return;
    bottomHourlyCards.innerHTML = '';

    // Display only first 6 hours for bottom section
    data.hourly.slice(0, 6).forEach((hour, index) => {
        const card = document.createElement('div');
        card.className = 'bottom-hourly-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const dateTime = new Date(hour.timestamp * 1000);
        const timeStr = dateTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        const temp = isCelsius ? hour.temperature.celsius : hour.temperature.fahrenheit;
        const unit = isCelsius ? '°C' : '°F';

        card.innerHTML = `
            <div class="bottom-hourly-time">${timeStr}</div>
            <img class="bottom-hourly-icon" src="https://openweathermap.org/img/wn/${hour.icon}@2x.png" alt="${hour.description}">
            <div class="bottom-hourly-temp">${temp}${unit}</div>
            <div class="bottom-hourly-desc">${hour.description.split(' ')[0]}</div>
        `;

        bottomHourlyCards.appendChild(card);
    });
}



async function fetchWeather(city) {
    if (!city.trim()) {
        showError('Please enter a city name');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data');
        }

        displayWeather(data);
    } catch (error) {
        hideLoading();
        showError(error.message || 'Unable to fetch weather data. Please try again.');
    }
}

async function fetchBottomHourly(city) {
    if (!city && !currentWeatherData) {
        return;
    }

    const searchCity = city || currentWeatherData.city;

    try {
        const response = await fetch(`/api/hourly?city=${encodeURIComponent(searchCity)}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch bottom hourly data:', data.error);
            return;
        }

        displayBottomHourly(data);
    } catch (error) {
        console.error('Error fetching bottom hourly data:', error);
    }
}

async function fetchAQI(lat, lon) {
    try {
        const response = await fetch(`/api/aqi?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch AQI data:', data.error);
            aqi.textContent = 'N/A';
            return;
        }

        aqi.textContent = `${data.aqi} (${data.category})`;
        aqi.style.color = data.color;
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        aqi.textContent = 'N/A';
    }
}

// Favorites functionality
let favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];

function updateFavoriteButton() {
    if (!currentWeatherData) return;

    const isFavorite = favorites.some(fav => fav.city === currentWeatherData.city && fav.country === currentWeatherData.country);

    favoriteBtn.classList.toggle('active', isFavorite);
    favoriteBtn.querySelector('svg').style.fill = isFavorite ? 'currentColor' : 'none';
}

function toggleFavorite() {
    if (!currentWeatherData) return;

    const cityData = {
        city: currentWeatherData.city,
        country: currentWeatherData.country,
        coordinates: currentWeatherData.coordinates
    };

    const existingIndex = favorites.findIndex(fav => fav.city === cityData.city && fav.country === cityData.country);

    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push(cityData);
    }

    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    updateFavoriteButton();
    updateFavoritesList();
}

function updateFavoritesList() {
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="no-favorites">No favorite cities yet. Click the heart icon to add cities to your favorites.</p>';
        return;
    }

    favorites.forEach(fav => {
        const favItem = document.createElement('div');
        favItem.className = 'favorite-item';
        favItem.innerHTML = `
            <div class="favorite-info">
                <span class="favorite-city">${fav.city}</span>
                <span class="favorite-country">${fav.country}</span>
            </div>
            <button class="remove-favorite" data-city="${fav.city}" data-country="${fav.country}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        favItem.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite')) {
                fetchWeather(fav.city);
                closeFavoritesSidebar();
            }
        });

        favoritesList.appendChild(favItem);
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const city = btn.getAttribute('data-city');
            const country = btn.getAttribute('data-country');
            removeFavorite(city, country);
        });
    });
}

function removeFavorite(city, country) {
    favorites = favorites.filter(fav => !(fav.city === city && fav.country === country));
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    updateFavoritesList();
    updateFavoriteButton();
}

function openFavoritesSidebar() {
    favoritesSidebar.classList.add('show');
    favoritesOverlay.classList.add('show');
    updateFavoritesList();
}

function closeFavoritesSidebar() {
    favoritesSidebar.classList.remove('show');
    favoritesOverlay.classList.remove('show');
}

async function fetchForecast(city) {
    if (!city && !currentWeatherData) {
        showError('Please search for a city first');
        return;
    }

    const searchCity = city || currentWeatherData.city;

    forecastLoadingSpinner.classList.add('show');

    try {
        const response = await fetch(`/api/forecast?city=${encodeURIComponent(searchCity)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch forecast data');
        }

        displayForecast(data);
    } catch (error) {
        forecastLoadingSpinner.classList.remove('show');
        showError(error.message || 'Unable to fetch forecast data. Please try again.');
    }
}



searchBtn.addEventListener('click', () => {
    const city = cityInput.value;
    fetchWeather(city);
    hideSuggestions();
    // Automatically fetch forecast data after weather data
    setTimeout(() => {
        if (currentWeatherData) {
            fetchForecast(city);
        }
    }, 500);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value;
        fetchWeather(city);
        hideSuggestions();
        // Automatically fetch forecast data after weather data
        setTimeout(() => {
            if (currentWeatherData) {
                fetchForecast(city);
            }
        }, 500);
    }
});

cityInput.addEventListener('input', (e) => {
    clearTimeout(suggestionsTimeout);
    suggestionsTimeout = setTimeout(() => {
        showSuggestions(e.target.value);
    }, 300);
});

document.addEventListener('click', (e) => {
    if (!citySuggestions.contains(e.target) && e.target !== cityInput) {
        hideSuggestions();
    }
});

celsiusBtn.addEventListener('click', () => {
    isCelsius = true;
    updateTemperatureDisplay();
    if (currentWeatherData) {
        fetchForecast(currentWeatherData.city);
        fetchBottomHourly(currentWeatherData.city);
        if (hourlyView.classList.contains('show')) {
            fetchHourly(currentWeatherData.city);
        }
    }
});

fahrenheitBtn.addEventListener('click', () => {
    isCelsius = false;
    updateTemperatureDisplay();
    if (currentWeatherData) {
        fetchForecast(currentWeatherData.city);
        fetchBottomHourly(currentWeatherData.city);
        if (hourlyView.classList.contains('show')) {
            fetchHourly(currentWeatherData.city);
        }
    }
});

themeToggle.addEventListener('click', toggleTheme);

forecastBtn.addEventListener('click', () => {
    if (currentWeatherData) {
        fetchForecast(currentWeatherData.city);
    }
});

// Back button for forecast view
backBtn.addEventListener('click', () => {
    showCurrentWeatherView();
});

favoritesToggle.addEventListener('click', openFavoritesSidebar);
favoriteBtn.addEventListener('click', toggleFavorite);
closeFavoritesBtn.addEventListener('click', closeFavoritesSidebar);
favoritesOverlay.addEventListener('click', closeFavoritesSidebar);

initTheme();

// Initialize particles for default weather
updateSkyBackground('clear');

// Fetch weather and forecast data on load
fetchWeather('Hassan');
setTimeout(() => {
    fetchForecast('Hassan');
}, 500);
