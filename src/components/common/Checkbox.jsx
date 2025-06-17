import React from "react";

const Checkbox = ({ label, checked, onChange, name, subLabel, linkText }) => {
  return (
    <div className="flex items-center mb-3">
      <div>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          name={name}
          id={name}
          className="w-6 h-5 text-blue-600 rounded focus:ring-0 focus:ring-offset-0 border-blue-300"
        />
      </div>
      <div className="ml-2 flex flex-col">
        <label htmlFor={name} className="text-sm text-white">
          {label}
        </label>
        <label htmlFor={name} className="text-[9px] text-white">
          {subLabel}{" "}
          <a href="#" style={{ textDecoration: "underline" }}>
            {linkText}
          </a>
        </label>
      </div>
    </div>
  );
};

export default Checkbox;
