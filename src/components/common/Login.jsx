// "use client";
import React, { useState } from "react";

export default function Login({ handle }) {
  const [email, setEmail] = useState(null);
  const [pass, setPass] = useState(null);
  const getData = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPass(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email === "teste.dupont@gmail.com" && pass === "tested") {
      handle(true);
    }

    // You can add your login logic here.
  };
  return (
    <section>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p>Adrénaline Tour</p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              required
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              onChange={getData}
              style={{
                width: "fit-content",
                padding: "5px",
                borderRadius: "5px",
                color: "black",
              }}
            />
            <input
              required
              name="password"
              type="password"
              placeholder="********"
              onChange={getData}
              id="password"
              autoComplete="current-password"
              style={{
                width: "fit-content",
                padding: "5px",
                borderRadius: "5px",
                color: "black",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "rgb(211, 211, 211, 0.1)",
                padding: "10px",
                borderRadius: "5px",
              }}
              //   onClick={handleSubmit}
            >
              Se connecter
            </button>
          </div>
        </div>
      </form>
      {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
    </section>
  );
}
