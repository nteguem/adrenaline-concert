import React, { useState } from "react";

const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  className = "",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Gérer le cas spécial des champs de type date
  if (type === "date") {
    return (
      <div className="relative">
        <input
          type={isFocused ? "date" : "text"}
          placeholder="DATE DE NAISSANCE"
          value={value}
          onChange={onChange}
          name={name}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`bg-blue-600 text-white w-full rounded p-3 mb-3 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
        />
      </div>
    );
  }
  
  // Pour les autres types d'input
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      className={`bg-blue-600 text-white w-full rounded p-3 mb-3 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
    />
  );
};

export default Input;