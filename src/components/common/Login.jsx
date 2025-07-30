// "use client";
import React, { useState } from "react";

export default function Login({ handle }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  
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
    
    // Vérification que les champs ne sont pas vides
    if (!email || !pass) {
      console.log("Email ou mot de passe manquant");
      return;
    }
    
    // Conversion en minuscules pour email ET mot de passe
    const emailLowerCase = email.toLowerCase();
    const passLowerCase = pass.toLowerCase();
    const referenceEmail = "teste.dupont@gmail.com";
    const referencePass = "tested";
    
    console.log("Email saisi:", emailLowerCase);
    console.log("Pass saisi:", passLowerCase);
    
    if (emailLowerCase === referenceEmail && passLowerCase === referencePass) {
      console.log("Connexion réussie !");
      handle(true);
    } else {
      console.log("Identifiants incorrects");
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
            >
              Se connecter
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}