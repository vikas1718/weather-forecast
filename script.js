const OPENWEATHER_API_KEY = '393b711701f817cf811e5a84e98047ca';

const UV_CATEGORIES = {
    '0-2': { label: 'Low', color: '#289500', advice: 'Minimal sun protection required. You can safely stay outside using minimal sun protection.' },
    '3-5': { label: 'Moderate', color: '#f7e400', advice: 'Some protection required. Seek shade during midday hours, wear protective clothing, and use sunscreen.' },
    '6-7': { label: 'High', color: '#f85900', advice: 'Extra protection required. Seek shade during midday hours, wear protective clothing, and use sunscreen.' },
    '8-10': { label: 'Very High', color: '#d8001d', advice: 'Maximum protection required. Avoid sun exposure between 10 a.m. and 4 p.m., wear protective clothing, and use sunscreen.' },
    '11+': { label: 'Extreme', color: '#6b49c8', advice: 'Extreme protection required. Avoid sun exposure between 10 a.m. and 4 p.m., wear protective clothing, and use sunscreen.' }
};

const AQI_CATEGORIES = {
    1: { label: 'Good', color: '#00e400', advice: 'Air quality is satisfactory, and air pollution poses little or no risk.' },
    2: { label: 'Fair', color: '#ffff00', advice: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.' },
    3: { label: 'Moderate', color: '#ff7e00', advice: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.' },
    4: { label: 'Poor', color: '#ff0000', advice: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.' },
    5: { label: 'Very Poor', color: '#8f3f97', advice: 'Health alert: The risk of health effects is increased for everyone.' }
};

function getUVCategory(uvValue) {
    if (uvValue <= 2) return UV_CATEGORIES['0-2'];
    if (uvValue <= 5) return UV_CATEGORIES['3-5'];
    if (uvValue <= 7) return UV_CATEGORIES['6-7'];
    if (uvValue <= 10) return UV_CATEGORIES['8-10'];
    return UV_CATEGORIES['11+'];
}

function generateWeatherAdvice(data) {
    const advice = [];
    const temp = data.temperature.celsius;
    const condition = data.description.toLowerCase();
    const uvIndex = data.uv_index ? data.uv_index.value : null;
    const aqi = data.aqi ? data.aqi.value : null;

    // Temperature-based advice
    if (temp >= 30) {
        advice.push("It's very hot today! Stay hydrated and avoid prolonged sun exposure.");
    } else if (temp >= 25) {
        advice.push("It's warm today. Wear light clothing and stay cool.");
    } else if (temp <= 5) {
        advice.push("It's quite cold! Bundle up with warm layers and protect extremities.");
    } else if (temp <= 10) {
        advice.push("It's chilly today. Consider wearing a jacket or sweater.");
    }

    // Weather condition-based advice
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
        advice.push("Don't forget your umbrella or raincoat for the showers.");
    } else if (condition.includes('snow')) {
        advice.push("Snowy conditions ahead! Drive carefully and wear warm, waterproof clothing.");
    } else if (condition.includes('clear') && temp >= 20) {
        advice.push("Perfect weather for outdoor activities! Enjoy the sunshine.");
    } else if (condition.includes('cloud')) {
        advice.push("Cloudy skies today. A light jacket might be useful.");
    }

    // UV index advice
    if (uvIndex !== null && uvIndex >= 3) {
        const uvAdvice = getUVCategory(uvIndex).advice;
        advice.push(uvAdvice);
    }

    // AQI advice
    if (aqi !== null && aqi >= 3) {
        const aqiAdvice = AQI_CATEGORIES[aqi].advice;
        advice.push(aqiAdvice);
    }

    // Wind advice
    if (data.wind_speed >= 15) {
        advice.push("Strong winds today! Secure loose objects and be cautious outdoors.");
    }

    // Default advice if no specific conditions
    if (advice.length === 0) {
        advice.push("Enjoy the weather today! Stay comfortable and make the most of your day.");
    }

    return advice[Math.floor(Math.random() * advice.length)];
}

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
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_API_KEY}`);
        const data = await response.json();

        if (!response.ok || !data || data.length === 0) {
            hideSuggestions();
            return;
        }

        citySuggestions.innerHTML = data.map(suggestion => {
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

function generateWeatherAdvice(data) {
    const advice = [];
    const temp = data.temperature.celsius;
    const condition = data.description.toLowerCase();
    const uvIndex = data.uv_index ? data.uv_index.value : null;
    const aqi = data.aqi ? data.aqi.value : null;

    // Temperature-based advice
    if (temp >= 30) {
        advice.push("It's very hot today! Stay hydrated and avoid prolonged sun exposure.");
    } else if (temp >= 25) {
        advice.push("It's warm today. Wear light clothing and stay cool.");
    } else if (temp <= 5) {
        advice.push("It's quite cold! Bundle up with warm layers and protect extremities.");
    } else if (temp <= 10) {
        advice.push("It's chilly today. Consider wearing a jacket or sweater.");
    }

    // Weather condition-based advice
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
        advice.push("Don't forget your umbrella or raincoat for the showers.");
    } else if (condition.includes('snow')) {
        advice.push("Snowy conditions ahead! Drive carefully and wear warm, waterproof clothing.");
    } else if (condition.includes('clear') && temp >= 20) {
        advice.push("Perfect weather for outdoor activities! Enjoy the sunshine.");
    } else if (condition.includes('cloud')) {
        advice.push("Cloudy skies today. A light jacket might be useful.");
    }

    // UV index advice
    if (uvIndex !== null && uvIndex >= 3) {
        const uvAdvice = getUVCategory(uvIndex).advice;
        advice.push(uvAdvice);
    }

    // AQI advice
    if (aqi !== null && aqi >= 3) {
        const aqiAdvice = AQI_CATEGORIES[aqi].advice;
        advice.push(aqiAdvice);
    }

    // Wind advice
    if (data.wind_speed >= 15) {
        advice.push("Strong winds today! Secure loose objects and be cautious outdoors.");
    }

    // Default advice if no specific conditions
    if (advice.length === 0) {
        advice.push("Enjoy the weather today! Stay comfortable and make the most of your day.");
    }

    return advice[Math.floor(Math.random() * advice.length)];
}

function displayWeather(data) {
    currentWeatherData = data;
    console.log('displayWeather called with data:', data);

    // Animate city name with typing effect
    animateText('cityName', data.city, 50);
    document.getElementById('country').textContent = data.country;

    // Animate weather description
    animateText('weatherDescription', data.description, 30);

    // Animate weather icon with bounce effect
    const weatherIcon = document.getElementById('weatherIcon');
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@4x.png`;
    weatherIcon.style.animation = 'iconBounce 0.6s ease-out';

    // Animate humidity with counter effect
    animateCounter('humidity', data.humidity, '%', 1000);

    // Animate wind speed
    animateCounter('windSpeed', data.wind_speed, ' m/s', 1000);

    // Animate pressure
    animateCounter('pressure', data.pressure, ' hPa', 1000);

    // Update UV Index display with color animation
    if (data.uv_index) {
        animateUVIndex(data.uv_index);
    } else {
        uvIndex.textContent = 'N/A';
    }

    // Update wind direction compass with smooth rotation
    if (data.wind_direction !== undefined) {
        animateWindDirection(data.wind_direction);
    }

    // Update sky background and particles based on weather condition
    updateSkyBackground(data.description.toLowerCase());

    updateTemperatureDisplay();

    // Generate and display weather advice with typing effect
    const adviceText = generateWeatherAdvice(data);
    animateText('weatherAdvice', adviceText, 20);

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

    // Add interactive hover effects
    addInteractiveEffects();
}

function animateText(elementId, text, speed = 50) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    let i = 0;

    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

function animateCounter(elementId, targetValue, suffix = '', duration = 1000) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = `${currentValue}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function animateUVIndex(uvData) {
    const element = document.getElementById('uvIndex');
    element.textContent = `${uvData.value} (${uvData.category})`;
    element.style.color = 'transparent';
    element.style.background = `linear-gradient(45deg, ${uvData.color}, ${uvData.color})`;
    element.style.backgroundClip = 'text';
    element.style.webkitBackgroundClip = 'text';
    element.style.animation = 'uvGlow 1s ease-out';
}

function animateWindDirection(direction) {
    const arrow = document.getElementById('windArrow');
    arrow.style.transition = 'transform 1s ease-out';
    arrow.style.transform = `rotate(${direction}deg)`;
}

function addInteractiveEffects() {
    // Add hover effects to detail items
    const detailItems = document.querySelectorAll('.detail-item');
    detailItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('detail-item-animated');

        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-8px) scale(1.05)';
            item.style.boxShadow = '0 15px 30px rgba(102, 126, 234, 0.3)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
            item.style.boxShadow = '';
        });
    });

    // Add click effect to temperature
    const temperature = document.querySelector('.temperature h1');
    temperature.addEventListener('click', () => {
        temperature.style.animation = 'temperaturePulse 0.6s ease-in-out';
        setTimeout(() => {
            temperature.style.animation = '';
        }, 600);
    });

    // Add interactive weather icon
    const weatherIcon = document.getElementById('weatherIcon');
    weatherIcon.addEventListener('click', () => {
        weatherIcon.style.animation = 'iconSpin 0.5s ease-in-out';
        setTimeout(() => {
            weatherIcon.style.animation = '';
        }, 500);
    });
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
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            throw new Error(weatherData.message || 'Failed to fetch weather data');
        }

        const { lat, lon } = weatherData.coord;
        
        // Fetch UV index
        const uvResponse = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
        const uvData = uvResponse.ok ? await uvResponse.json() : { value: 0 };

        const uvValue = Math.round(uvData.value * 10) / 10;
        const uvCat = getUVCategory(uvValue);

        const formattedData = {
            city: weatherData.name,
            country: weatherData.sys.country,
            temperature: {
                celsius: Math.round(weatherData.main.temp * 10) / 10,
                fahrenheit: Math.round((weatherData.main.temp * 9/5 + 32) * 10) / 10
            },
            feels_like: {
                celsius: Math.round(weatherData.main.feels_like * 10) / 10,
                fahrenheit: Math.round((weatherData.main.feels_like * 9/5 + 32) * 10) / 10
            },
            humidity: weatherData.main.humidity,
            description: weatherData.weather[0].description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            icon: weatherData.weather[0].icon,
            wind_speed: weatherData.wind.speed,
            wind_direction: weatherData.wind.deg || 0,
            pressure: weatherData.main.pressure,
            uv_index: {
                value: uvValue,
                category: uvCat.label,
                color: uvCat.color,
                advice: uvCat.advice
            },
            coordinates: {
                lat: lat,
                lon: lon
            }
        };

        displayWeather(formattedData);
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
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(searchCity)}&appid=${OPENWEATHER_API_KEY}&units=metric`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch bottom hourly data:', data.message);
            return;
        }

        const hourlyList = data.list.slice(0, 6).map(item => ({
            timestamp: item.dt,
            temperature: {
                celsius: Math.round(item.main.temp * 10) / 10,
                fahrenheit: Math.round((item.main.temp * 9/5 + 32) * 10) / 10
            },
            description: item.weather[0].description,
            icon: item.weather[0].icon
        }));

        displayBottomHourly({ hourly: hourlyList });
    } catch (error) {
        console.error('Error fetching bottom hourly data:', error);
    }
}

async function fetchAQI(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch AQI data:', data.message);
            aqi.textContent = 'N/A';
            return;
        }

        const aqiValue = data.list[0].main.aqi;
        const category = AQI_CATEGORIES[aqiValue] || { label: 'Unknown', color: '#666666' };

        aqi.textContent = `${aqiValue} (${category.label})`;
        aqi.style.color = category.color;

        // Update advice with AQI data if available
        if (currentWeatherData) {
            currentWeatherData.aqi = { value: aqiValue, category: category.label };
            const adviceText = generateWeatherAdvice(currentWeatherData);
            const adviceElement = document.getElementById('weatherAdvice');

            // Add fade out animation
            adviceElement.style.opacity = '0';
            adviceElement.style.transform = 'translateY(10px)';

            setTimeout(() => {
                adviceElement.textContent = adviceText;
                adviceElement.style.opacity = '1';
                adviceElement.style.transform = 'translateY(0)';
            }, 200);
        }
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
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(searchCity)}&appid=${OPENWEATHER_API_KEY}&units=metric`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch forecast data');
        }

        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temps: [],
                    descriptions: [],
                    icons: []
                };
            }
            dailyForecasts[date].temps.push(item.main.temp);
            dailyForecasts[date].descriptions.push(item.weather[0].description);
            dailyForecasts[date].icons.push(item.weather[0].icon);
        });

        const forecastList = Object.keys(dailyForecasts).sort().slice(0, 5).map(date => {
            const values = dailyForecasts[date];
            const maxTemp = Math.max(...values.temps);
            const minTemp = Math.min(...values.temps);
            const mostCommonDesc = values.descriptions.sort((a, b) =>
                values.descriptions.filter(v => v === a).length - values.descriptions.filter(v => v === b).length
            ).pop();
            const mostCommonIcon = values.icons.sort((a, b) =>
                values.icons.filter(v => v === a).length - values.icons.filter(v => v === b).length
            ).pop();

            return {
                date: date,
                temperature: {
                    max_celsius: Math.round(maxTemp * 10) / 10,
                    min_celsius: Math.round(minTemp * 10) / 10,
                    max_fahrenheit: Math.round((maxTemp * 9/5 + 32) * 10) / 10,
                    min_fahrenheit: Math.round((minTemp * 9/5 + 32) * 10) / 10
                },
                description: mostCommonDesc.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                icon: mostCommonIcon
            };
        });

        displayForecast({
            city: data.city.name,
            country: data.city.country,
            forecast: forecastList
        });
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
