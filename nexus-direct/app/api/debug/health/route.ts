import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const SPRING_BOOT_API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG] Spring Boot API URL:", SPRING_BOOT_API);

    // Try to reach health endpoint
    const response = await axios.get(`${SPRING_BOOT_API}/health`, {
      timeout: 5000
    });

    return NextResponse.json({
      status: "ok",
      springBootUrl: SPRING_BOOT_API,
      springBootHealth: response.data
    });
  } catch (error: unknown) {
    console.error("[DEBUG] Health check error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          status: "error",
          springBootUrl: SPRING_BOOT_API,
          error: {
            message: error.message,
            code: error.code,
            status: error.response?.status
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        springBootUrl: SPRING_BOOT_API,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
