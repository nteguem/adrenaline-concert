import React from "react";

const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  className = "",
}) => {
  return (
    <>
      {type === "date" && (
        <small className="text-gray-300">Votre Date De Naissance</small>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        className={`bg-blue-600 text-white w-full rounded p-3 mb-3 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
      />
    </>
  );
};

export default Input;
