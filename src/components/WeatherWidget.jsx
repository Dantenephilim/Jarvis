import React, { useState, useEffect } from 'react';

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Get rough location via IP
                const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const geo = await geoRes.json();
                
                // Fetch weather
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m`);
                const weatherData = await weatherRes.json();
                
                setWeather({
                    city: geo.city,
                    country: geo.country,
                    temp: weatherData.current.temperature_2m,
                    feelsLike: weatherData.current.apparent_temperature,
                    humidity: weatherData.current.relative_humidity_2m,
                    wind: weatherData.current.wind_speed_10m,
                    precip: weatherData.current.precipitation
                });
            } catch (err) {
                console.error("Weather API failed");
            }
        };
        fetchWeather();
    }, []);

    if (!weather) return <div style={{ position: 'absolute', right: '40px', top: '150px', color: '#555', fontSize: '0.65rem', fontFamily: 'var(--font-main)' }}>Initializing METEO...</div>;

    return (
        <div style={{
            position: 'absolute',
            right: '40px',
            top: '150px',
            color: 'var(--text-color)',
            fontFamily: 'var(--font-main)',
            width: '300px',
            fontSize: '0.75rem',
            letterSpacing: '1px'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ width: '2px', height: '100px', background: 'var(--primary-glow)' }}></div>
                <div>
                    <div style={{ color: 'var(--primary-glow)', textTransform: 'uppercase', fontSize: '0.65rem' }}>{weather.city}, {weather.country}</div>
                    <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '10px' }}>Global Meteo Network</div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>{weather.temp}°C</span>
                        <span style={{ color: 'var(--primary-glow)' }}>Atmosphere</span>
                    </div>

                    <div style={{ color: '#888', marginTop: '10px', lineHeight: '1.4' }}>
                        <div>Humidity: {weather.humidity}%</div>
                        <div>Feels Like: {weather.feelsLike}°C</div>
                        <div>Precipitation: {weather.precip} mm</div>
                        <div>Wind: {weather.wind} km/h</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
