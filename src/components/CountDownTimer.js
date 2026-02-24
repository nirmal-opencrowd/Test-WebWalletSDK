import React, { useEffect, useRef } from 'react';

const CountDownTimer = ({timerDuration}) => {
    const canvasRef = useRef(null);
    const radius = 35;
    const lineWidth = 5;
  
    let remainingTime = timerDuration;
    let arcEndAngle = 0;
  
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
  
      const updateTimer = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
  
        arcEndAngle = ((timerDuration - remainingTime) / timerDuration) * (2 * Math.PI) - Math.PI / 2;
  
        context.beginPath();
        context.arc(radius, radius, radius - lineWidth, 0, 2 * Math.PI);
        context.lineWidth = lineWidth;
        context.strokeStyle = '#18C2EE';
        context.stroke();
  
        context.beginPath();
        context.arc(radius, radius, radius - lineWidth, -Math.PI / 2, arcEndAngle);
        context.lineWidth = lineWidth;
        context.strokeStyle = '#ffffff';
        context.stroke();
  
        context.font = '23px Arial';
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(remainingTime.toString(), radius, radius);
  
        remainingTime--;
  
        if (remainingTime < 0) {
          clearInterval(interval);
        }
      };
  
      const interval = setInterval(updateTimer, 1000);
  
      return () => {
        clearInterval(interval);
      };
    }, []);
  
    return (
      <canvas ref={canvasRef} width={2 * radius} height={2 * radius} />
    );
  };

export default CountDownTimer;