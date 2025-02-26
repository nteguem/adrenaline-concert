import React from 'react';

const Checkbox = ({ label, checked, onChange, name }) => {
  return (
    <div className="flex items-center mb-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        name={name}
        id={name}
        className="w-5 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0 border-blue-300"
      />
      <label htmlFor={name} className="ml-2 text-sm text-white">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;