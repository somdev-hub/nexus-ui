import apiClient, { apiClientMultipart } from "@/lib/api-client";


export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    orgId?: string;
    avatar?: string;
  };
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  orgId: string;
  name: string;
  role: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
    /**
     * private String firstName;
    private String lastName;
    private String phone;
    private String personalEmail;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private Gender gender;
    private Integer age;
    private Date dateOfBirth;
    private String password;
     */
    firstName: string;
    lastName: string;
    phone?: string;
    personalEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    gender?: string;
    age?: number;
    dateOfBirth?: string; // ISO string
    password: string;
}


export async function login(credentials: LoginRequest): Promise<AuthResponse> {
    // Dummy auth flow for development mode
    // if (!GlobalConfig.wowoFeatures.auth) {
    //     // Create a dummy user from any credentials
    //     const dummyUser: User = {
    //         id: "dev-user-" + Date.now(),
    //         email: credentials.email,
    //         name: credentials.email.split("@")[0],
    //         phone: "1234567890",
    //         role: "ROLE_ADMIN",
    //         orgId: "dev-org",
    //         avatar: `/avatars/default.jpg`,
    //     };

    //     return {
    //         accessToken: "",
    //         refreshToken: "",
    //         tokenType: "Bearer",
    //         expiresIn: 86400,
    //         user: dummyUser,
    //     };
    // }

    try {
        console.log("[AUTH SERVICE] Logging in user:", credentials.email);

        // Call Next.js API route instead of Spring Boot directly
        // JWT tokens are kept server-side in encrypted cookies
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies
            body: JSON.stringify(credentials),
        });

        console.log("[AUTH SERVICE] Response status:", response.status);
        console.log("[AUTH SERVICE] Response ok:", response.ok);

        if (!response.ok) {
            const error = await response.json();
            console.error("[AUTH SERVICE] Login error:", error);
            throw new Error(error.error || "Login failed");
        }

        const data = await response.json();
        console.log("[AUTH SERVICE] Login successful, user:", data.user?.email);

        return {
            accessToken: "", // Not exposed to frontend
            refreshToken: "", // Not exposed to frontend
            tokenType: "Bearer",
            expiresIn: 3600,
            user: data.user,
        };
    } catch (error: unknown) {
        console.error("[AUTH SERVICE] Login error:", error);
        throw new Error("Login failed: " + (error as Error).message);
    }
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
    // Dummy auth flow for development mode
    // if (!GlobalConfig.wowoFeatures.auth) {
    //     // Create a dummy user from signup data
    //     const dummyUser: User = {
    //         id: "dev-user-" + Date.now(),
    //         email: data.email,
    //         name: data.name,
    //         phone: data.phone || "1234567890",
    //         role: "ROLE_ADMIN",
    //         orgId: "dev-org",
    //         avatar: `/avatars/${data.name}.jpg`,
    //     };

    //     return {
    //         accessToken: "",
    //         refreshToken: "",
    //         tokenType: "Bearer",
    //         expiresIn: 86400,
    //         user: dummyUser,
    //     };
    // }

    try {
        console.log("[AUTH SERVICE] Starting signup for email:", data.email);

        const formData = new FormData();

        // Handle profilePicture: convert base64 string to Blob if needed
        if (data.profilePicture) {
            if (typeof data.profilePicture === "string") {
                // Convert base64 string to Blob
                // Handle both "data:image/jpeg;base64,..." and raw base64 formats
                const base64String = data.profilePicture.includes(",")
                    ? data.profilePicture.split(",")[1]
                    : data.profilePicture;

                const byteCharacters = atob(base64String);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "image/jpeg" });
                formData.append("profilePicture", blob, "profile.jpg");
            } else {
                // It's a File object
                formData.append("profilePicture", data.profilePicture as Blob);
            }
        }

        formData.append(
            "dto",
            new Blob(
                [
                    JSON.stringify({
                        name: data.name,
                        email: data.email,
                        personalEmail: data.personalEmail,
                        password: data.password,
                        phone: data.phone,
                        title: data.title,
                        role: data.role,
                        gender: data.gender,
                        age: data.age,
                        dateOfBirth: data.dateOfBirth,
                        department: data.department,
                        address: data.address,
                        compensation: data.compensation,
                        orgName: data.orgName,
                        orgType: data.orgType,
                    }),
                ],
                { type: "application/json" },
            ),
        );

        console.log("[AUTH SERVICE] Calling /api/auth/signup endpoint");

        // Call Next.js API route directly (not through proxy)
        // This endpoint doesn't require authentication
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            credentials: "include", // Include cookies for session tokens
            body: formData,
            // Don't set Content-Type header - let fetch set it with proper boundary
        });

        console.log("[AUTH SERVICE] Response status:", response.status);
        console.log("[AUTH SERVICE] Response ok:", response.ok);

        if (!response.ok) {
            const error = await response.json();
            console.error("[AUTH SERVICE] Signup error:", error);
            throw new Error(error.error || "Signup failed");
        }

        const data_response = await response.json();
        console.log(
            "[AUTH SERVICE] Signup successful, user:",
            data_response.user?.email,
        );

        // Store user in localStorage
        // Tokens are kept server-side in encrypted cookies
        localStorage.setItem("auth_user", JSON.stringify(data_response.user));

        return {
            accessToken: "", // Not exposed to frontend
            refreshToken: "", // Not exposed to frontend
            tokenType: "Bearer",
            expiresIn: data_response.expiresIn || 3600,
            user: data_response.user,
        };
    } catch (error: unknown) {
        console.error("[AUTH SERVICE] Signup failed:", error);
        throw new Error("Signup failed: " + (error as Error).message);
    }
}

export async function logout(): Promise<void> {
    // Call Next.js API route to clear server-side session
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include", // Include cookies
        });
    } catch (error: unknown) {
        console.error("Logout error:", error);
    }
    // Clear frontend state
    localStorage.removeItem("auth_user");
}

export async function refreshToken(): Promise<string> {
    // Dummy token refresh for development mode
    // if (!GlobalConfig.wowoFeatures.auth) {
    //     return "dev-token-" + Date.now();
    // }

    try {
        console.log("[AUTH SERVICE] Refreshing token...");
        // Call Next.js API route to refresh token (handled server-side)
        const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Include cookies
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("[AUTH SERVICE] Refresh response status:", response.status);
        console.log("[AUTH SERVICE] Refresh response ok:", response.ok);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[AUTH SERVICE] Refresh error:", errorData);
            throw new Error(errorData.error || "Token refresh failed");
        }

        await response.json();
        console.log("[AUTH SERVICE] Token refreshed successfully");

        // Session is automatically updated in cookies, return empty string
        // since tokens are not exposed to frontend
        return "";
    } catch (error: unknown) {
        console.error("[AUTH SERVICE] Token refresh failed:", error);
        throw new Error(`Token refresh failed: ${(error as Error).message}`);
    }
}
