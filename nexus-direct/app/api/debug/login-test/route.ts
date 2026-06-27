import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint for debugging login flow
 * Echo back the request to verify the auth route can be called
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[DEBUG LOGIN TEST] Received request");

    const body = await request.json();
    console.log("[DEBUG LOGIN TEST] Request body:", body);

    // Return a mock response
    const mockResponse = {
      success: true,
      message: "Test endpoint - this is a mock response",
      received: body
    };

    console.log("[DEBUG LOGIN TEST] Returning mock response");

    const response = NextResponse.json(mockResponse);

    // Set test cookies
    response.cookies.set("test-cookie", "test-value", {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("[DEBUG LOGIN TEST] Error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
