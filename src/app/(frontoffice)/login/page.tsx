import { getSession, login } from "@/lib/lib";
import React from "react";

export default async function page() {
  const session = await getSession();
  return (
    <section>
      <form
        action={async (formData) => {
          "use server";
          await login(formData);
        }}
      >
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
              //   onChange={getData}
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
