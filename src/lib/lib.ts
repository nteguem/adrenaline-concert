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
        const postdata = {email: formData.get("email"), password: formData.get("password")}
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postdata),
          }
        );
        const data = await response.json(); // Parse the response data
        return data;
    }catch (err) {
        console.error("Error during login:", err);
      }
}

export async function login(formData: FormData) {
  // Verify credentials && get the user
  const gotresponse = await apiLogin(formData);
  if (gotresponse?.success === false) return
  if (gotresponse?.success === true) {
    const gotUser = {email: gotresponse?.user?.email, name: gotresponse?.user?.username, access: gotresponse?.accessToken}

    // Create the session
    // const expires = new Date(Date.now() + 60 * 60 * 1000); //one hour
    const expires = new Date(Date.now() + 30 * 1000);
    const session = await encrypt({ gotUser, expires });
    // const session = gotSession

    // Save the session in a cookie
    (await cookies()).set("session", session, { expires, httpOnly: true });
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