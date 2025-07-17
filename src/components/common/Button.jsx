import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
  const baseStyle = 'font-bold py-3 px-4 rounded text-center transition-colors duration-200';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-blue-300 hover:bg-blue-200 text-white',
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;