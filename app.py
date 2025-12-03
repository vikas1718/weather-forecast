from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/style.css')
def styles():
    return app.send_static_file('style.css')

@app.route('/script.js')
def scripts():
    return app.send_static_file('script.js')



@app.route('/api/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    
    if not city:
        return jsonify({'error': 'City name is required'}), 400
    
    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'API key not configured'}), 500
    
    try:
        url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric'
        response = requests.get(url, timeout=10)

        # Get UV index separately
        if response.status_code == 200:
            weather_data = response.json()
            lat = weather_data['coord']['lat']
            lon = weather_data['coord']['lon']
            uv_url = f'http://api.openweathermap.org/data/2.5/uvi?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}'
            uv_response = requests.get(uv_url, timeout=10)
            uv_data = uv_response.json() if uv_response.status_code == 200 else {'value': 0}
        else:
            uv_data = {'value': 0}
        
        if response.status_code == 404:
            return jsonify({'error': 'City not found'}), 404
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch weather data'}), response.status_code
        
        data = response.json()

        # UV index categories and advice
        uv_value = round(uv_data.get('value', 0), 1)
        uv_categories = {
            (0, 2): {'label': 'Low', 'color': '#289500', 'advice': 'Minimal sun protection required. You can safely stay outside using minimal sun protection.'},
            (3, 5): {'label': 'Moderate', 'color': '#f7e400', 'advice': 'Some protection required. Seek shade during midday hours, wear protective clothing, and use sunscreen.'},
            (6, 7): {'label': 'High', 'color': '#f85900', 'advice': 'Extra protection required. Seek shade during midday hours, wear protective clothing, and use sunscreen.'},
            (8, 10): {'label': 'Very High', 'color': '#d8001d', 'advice': 'Maximum protection required. Avoid sun exposure between 10 a.m. and 4 p.m., wear protective clothing, and use sunscreen.'},
            (11, float('inf')): {'label': 'Extreme', 'color': '#6b49c8', 'advice': 'Extreme protection required. Avoid sun exposure between 10 a.m. and 4 p.m., wear protective clothing, and use sunscreen.'}
        }

        uv_category = {'label': 'Unknown', 'color': '#666666', 'advice': 'Unable to determine UV index level.'}
        for (min_val, max_val), category in uv_categories.items():
            if min_val <= uv_value <= max_val:
                uv_category = category
                break

        weather_data = {
            'city': data['name'],
            'country': data['sys']['country'],
            'temperature': {
                'celsius': round(data['main']['temp'], 1),
                'fahrenheit': round((data['main']['temp'] * 9/5) + 32, 1)
            },
            'feels_like': {
                'celsius': round(data['main']['feels_like'], 1),
                'fahrenheit': round((data['main']['feels_like'] * 9/5) + 32, 1)
            },
            'humidity': data['main']['humidity'],
            'description': data['weather'][0]['description'].title(),
            'icon': data['weather'][0]['icon'],
            'wind_speed': data['wind']['speed'],
            'wind_direction': data['wind'].get('deg', 0),
            'pressure': data['main']['pressure'],
            'uv_index': {
                'value': uv_value,
                'category': uv_category['label'],
                'color': uv_category['color'],
                'advice': uv_category['advice']
            },
            'coordinates': {
                'lat': data['coord']['lat'],
                'lon': data['coord']['lon']
            }
        }
        
        return jsonify(weather_data), 200
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to connect to weather service'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/hourly', methods=['GET'])
def get_hourly():
    city = request.args.get('city')

    if not city:
        return jsonify({'error': 'City name is required'}), 400

    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'API key not configured'}), 500

    try:
        url = f'http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OPENWEATHER_API_KEY}&units=metric&cnt=40'
        response = requests.get(url, timeout=10)

        if response.status_code == 404:
            return jsonify({'error': 'City not found'}), 404

        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch hourly data'}), response.status_code

        data = response.json()

        hourly_list = []
        for item in data['list'][:4]:  # Next 12 hours (4 * 3-hour intervals)
            dt = item['dt']
            dt_txt = item['dt_txt']

            hourly_list.append({
                'datetime': dt_txt,
                'timestamp': dt,
                'temperature': {
                    'celsius': round(item['main']['temp'], 1),
                    'fahrenheit': round((item['main']['temp'] * 9/5) + 32, 1)
                },
                'feels_like': {
                    'celsius': round(item['main']['feels_like'], 1),
                    'fahrenheit': round((item['main']['feels_like'] * 9/5) + 32, 1)
                },
                'humidity': item['main']['humidity'],
                'description': item['weather'][0]['description'].title(),
                'icon': item['weather'][0]['icon'],
                'wind_speed': item['wind']['speed'],
                'precipitation': item.get('rain', {}).get('3h', 0) + item.get('snow', {}).get('3h', 0)
            })

        return jsonify({
            'city': data['city']['name'],
            'country': data['city']['country'],
            'hourly': hourly_list
        }), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to connect to weather service'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city')

    if not city:
        return jsonify({'error': 'City name is required'}), 400

    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'API key not configured'}), 500

    try:
        url = f'http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OPENWEATHER_API_KEY}&units=metric&cnt=40'
        response = requests.get(url, timeout=10)

        if response.status_code == 404:
            return jsonify({'error': 'City not found'}), 404

        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch forecast data'}), response.status_code

        data = response.json()

        daily_forecasts = {}
        for item in data['list']:
            date = item['dt_txt'].split(' ')[0]

            if date not in daily_forecasts:
                daily_forecasts[date] = {
                    'temps': [],
                    'descriptions': [],
                    'icons': []
                }

            daily_forecasts[date]['temps'].append(item['main']['temp'])
            daily_forecasts[date]['descriptions'].append(item['weather'][0]['description'])
            daily_forecasts[date]['icons'].append(item['weather'][0]['icon'])

        forecast_list = []
        for date, values in sorted(daily_forecasts.items())[:5]:
            max_temp = max(values['temps'])
            min_temp = min(values['temps'])

            most_common_desc = max(set(values['descriptions']), key=values['descriptions'].count)
            most_common_icon = max(set(values['icons']), key=values['icons'].count)

            forecast_list.append({
                'date': date,
                'temperature': {
                    'max_celsius': round(max_temp, 1),
                    'min_celsius': round(min_temp, 1),
                    'max_fahrenheit': round((max_temp * 9/5) + 32, 1),
                    'min_fahrenheit': round((min_temp * 9/5) + 32, 1)
                },
                'description': most_common_desc.title(),
                'icon': most_common_icon
            })

        return jsonify({
            'city': data['city']['name'],
            'country': data['city']['country'],
            'forecast': forecast_list
        }), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to connect to weather service'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/city-suggestions', methods=['GET'])
def get_city_suggestions():
    query = request.args.get('q')

    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400

    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'API key not configured'}), 500

    try:
        url = f'http://api.openweathermap.org/geo/1.0/direct?q={query}&limit=5&appid={OPENWEATHER_API_KEY}'
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch city suggestions'}), response.status_code

        data = response.json()

        suggestions = []
        for item in data:
            suggestion = {
                'name': item['name'],
                'country': item['country']
            }
            if 'state' in item:
                suggestion['state'] = item['state']
            suggestions.append(suggestion)

        return jsonify({'suggestions': suggestions}), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to connect to geocoding service'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/aqi', methods=['GET'])
def get_aqi():
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({'error': 'Latitude and longitude are required'}), 400

    if not OPENWEATHER_API_KEY:
        return jsonify({'error': 'API key not configured'}), 500

    try:
        url = f'http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}'
        response = requests.get(url, timeout=10)

        if response.status_code == 404:
            return jsonify({'error': 'Location not found'}), 404

        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch AQI data'}), response.status_code

        data = response.json()

        aqi_data = data['list'][0]
        aqi_value = aqi_data['main']['aqi']
        components = aqi_data['components']

        # AQI categories and colors
        aqi_categories = {
            1: {'label': 'Good', 'color': '#00e400', 'advice': 'Air quality is satisfactory, and air pollution poses little or no risk.'},
            2: {'label': 'Fair', 'color': '#ffff00', 'advice': 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.'},
            3: {'label': 'Moderate', 'color': '#ff7e00', 'advice': 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'},
            4: {'label': 'Poor', 'color': '#ff0000', 'advice': 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.'},
            5: {'label': 'Very Poor', 'color': '#8f3f97', 'advice': 'Health alert: The risk of health effects is increased for everyone.'}
        }

        category = aqi_categories.get(aqi_value, {'label': 'Unknown', 'color': '#666666', 'advice': 'Unable to determine air quality level.'})

        return jsonify({
            'aqi': aqi_value,
            'category': category['label'],
            'color': category['color'],
            'advice': category['advice'],
            'components': components
        }), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to connect to air quality service'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
