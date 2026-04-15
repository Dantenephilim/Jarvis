import React, { useState, useEffect } from 'react';

const DateTimeWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

  const dayName = days[time.getDay()];
  const monthName = months[time.getMonth()];

  return (
    <div style={{
      position: 'absolute',
      right: '50px',
      top: '30px',
      textAlign: 'right',
      fontFamily: 'var(--font-display)'
    }}>
      <div style={{ fontSize: '4rem', fontWeight: '900', color: '#fff', lineHeight: '0.8', textShadow: '0 0 10px rgba(0,255,136,0.2)' }}>
        {time.getDate()}
      </div>
      <div style={{ color: 'var(--alert-color)', letterSpacing: '4px', fontSize: '1.2rem', marginTop: '10px', fontWeight: 'bold' }}>
        {monthName}
      </div>
      <div style={{ color: '#aaa', letterSpacing: '2px', fontSize: '0.8rem' }}>
        {dayName}
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
        <div style={{ width: '40px', height: '2px', background: 'var(--primary-glow)', marginTop: '8px' }}></div>
        <div style={{ fontSize: '1rem', color: 'var(--primary-glow)', letterSpacing: '3px' }}>
          {hours}:{minutes}:{seconds}
        </div>
      </div>
    </div>
  );
};

export default DateTimeWidget;
