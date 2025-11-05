import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function encrypt(payload: any) {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer('urn:example:issuer')
    .setExpirationTime("2h")
    .sign(key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function apiLogin(formData: FormData) {
    try {
        // Normaliser l'email en minuscules pour éviter les problèmes de casse
        const emailInput = formData.get("email");
        const passwordInput = formData.get("password");
        
        if (!emailInput || !passwordInput) {
          console.error("[apiLogin] Email ou mot de passe manquant");
          return { success: false, code: 400, message: "Email et mot de passe requis" };
        }
        
        const postdata = {
          email: String(emailInput).toLowerCase().trim(), 
          password: String(passwordInput)
        };
        
        console.log("[apiLogin] Tentative de connexion pour:", postdata.email);
        
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            },
            body: JSON.stringify(postdata),
            cache: "no-store" // Désactive le cache Next.js
          }
        );
        
        const data = await response.json();
        console.log("[apiLogin] Réponse du serveur:", { 
          success: data.success, 
          code: data.code, 
          message: data.message,
          status: response.status 
        });
        
        return data;
    }catch (err) {
        console.error("[apiLogin] Erreur lors de la connexion:", err);
        return { 
          success: false, 
          code: 500, 
          message: "Erreur lors de la connexion au serveur" 
        };
      }
}

export async function login(formData: FormData) {
  // Verify credentials && get the user
  const gotresponse = await apiLogin(formData);
  
  console.log("[login] Réponse reçue:", { 
    success: gotresponse?.success, 
    code: gotresponse?.code,
    message: gotresponse?.message 
  });
  
  if (!gotresponse) {
    console.error("[login] Aucune réponse reçue de apiLogin");
    return;
  }
  
  if (gotresponse.success === false) {
    console.error("[login] Échec de l'authentification:", gotresponse.message);
    return;
  }
  
  if (gotresponse.success === true) {
    console.log("[login] Authentification réussie, création de la session...");
    const gotUser = {
      email: gotresponse?.user?.email, 
      name: gotresponse?.user?.username, 
      access: gotresponse?.accessToken
    }

    // Create the session
    // const expires = new Date(Date.now() + 60 * 60 * 1000); //one hour
    const expires = new Date(Date.now() + 30 * 1000);
    const session = await encrypt({ gotUser, expires });
    // const session = gotSession

    // Save the session in a cookie
    (await cookies()).set("session", session, { expires, httpOnly: true });
    console.log("[login] Session créée, redirection...");
    redirect("/")
  }
//   const user = { email: formData.get("email"), name: "John" };
//   // Create the session
//   const expires = new Date(Date.now() + 60 * 60 * 1000);
//   const session = await encrypt({ user, expires });
//   // const session = gotSession

//   // Save the session in a cookie
//   (await cookies()).set("session", session, { expires, httpOnly: true });
}

export async function logout() {
  // Destroy the session
  (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 10 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}