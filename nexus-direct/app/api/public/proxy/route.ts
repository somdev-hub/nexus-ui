import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSpringBootClient } from "@/lib/spring-boot-client";


function isStreamingEndpoint(path: string): boolean {
  return (
    path.includes("/stream") ||
    path.includes("/sse") ||
    path.includes("text/event-stream")
  );
}

function buildTargetUrl(path: string, searchParams: URLSearchParams): string {
  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== "path") {
      forwardParams.append(key, value);
    }
  }

  const queryString = forwardParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function handleUnauthorized(
  status: number,
  data: any,
): Promise<NextResponse> {
  return NextResponse.json(
    data || { error: "Unauthorized" },
    { status },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 },
    );
  }

  const targetUrl = buildTargetUrl(path, searchParams);

  const isStreaming = isStreamingEndpoint(path);

  try {
    console.log("[PUBLIC API PROXY GET] Target URL:", targetUrl);
    const springBootClient = getSpringBootClient();

    if (isStreaming) {
      console.log(
        "[PUBLIC API PROXY GET] Streaming endpoint detected, using stream response",
      );
      const streamResponse = await springBootClient.get(targetUrl, {
        responseType: "stream",
      });

      const stream = new ReadableStream({
        start(controller) {
          streamResponse.data.on("data", (chunk: Buffer) => {
            controller.enqueue(chunk);
          });
          streamResponse.data.on("end", () => {
            controller.close();
          });
          streamResponse.data.on("error", (error: Error) => {
            controller.error(error);
          });
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const response = await springBootClient.get(targetUrl);

    console.log("[PUBLIC API PROXY GET] Request successful");
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[PUBLIC API PROXY GET] Request failed");

    if (axios.isAxiosError(error)) {
      console.error(`[PUBLIC API PROXY GET] Error status: ${error.response?.status}`);
      console.error("[PUBLIC API PROXY GET] Error data:", error.response?.data);

      if (error.response?.status === 401) {
        return handleUnauthorized(401, error.response?.data);
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 },
    );
  }

  const targetUrl = buildTargetUrl(path, searchParams);

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const axiosConfig: any = {};

    if (contentType.includes("multipart/form-data")) {
      console.log("[PUBLIC API PROXY POST] Handling as multipart/form-data");
      body = await request.formData();
    } else {
      console.log("[PUBLIC API PROXY POST] Handling as application/json");
      body = await request.json().catch(() => ({}));
      axiosConfig.headers = { "Content-Type": "application/json" };
    }

    const springBootClient = getSpringBootClient();

    const isStreaming = isStreamingEndpoint(path);
    if (isStreaming) {
      console.log(
        "[PUBLIC API PROXY POST] Streaming endpoint detected, using stream response",
      );
      const streamResponse = await springBootClient.post(targetUrl, body, {
        ...axiosConfig,
        responseType: "stream",
      });

      const stream = new ReadableStream({
        start(controller) {
          streamResponse.data.on("data", (chunk: Buffer) => {
            controller.enqueue(chunk);
          });
          streamResponse.data.on("end", () => {
            controller.close();
          });
          streamResponse.data.on("error", (error: Error) => {
            controller.error(error);
          });
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const response = await springBootClient.post(targetUrl, body, axiosConfig);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[PUBLIC API PROXY POST] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error(
        "[PUBLIC API PROXY POST] Axios error response:",
        error.response?.data,
      );
      if (error.response?.status === 401) {
        return handleUnauthorized(401, error.response?.data);
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 },
    );
  }

  const targetUrl = buildTargetUrl(path, searchParams);

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const axiosConfig: any = {};

    if (contentType.includes("multipart/form-data")) {
      console.log("[PUBLIC API PROXY PUT] Handling as multipart/form-data");
      body = await request.formData();
    } else {
      console.log("[PUBLIC API PROXY PUT] Handling as application/json");
      body = await request.json().catch(() => ({}));
      axiosConfig.headers = { "Content-Type": "application/json" };
    }

    const springBootClient = getSpringBootClient();
    const response = await springBootClient.put(targetUrl, body, axiosConfig);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[PUBLIC API PROXY PUT] Error:", error);

    if (axios.isAxiosError(error)) {
      console.error(
        "[PUBLIC API PROXY PUT] Axios error response:",
        error.response?.data,
      );
      if (error.response?.status === 401) {
        return handleUnauthorized(401, error.response?.data);
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' query parameter" },
      { status: 400 },
    );
  }

  const targetUrl = buildTargetUrl(path, searchParams);

  try {
    const springBootClient = getSpringBootClient();
    const response = await springBootClient.delete(targetUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[PUBLIC API PROXY DELETE] Error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authorization expired" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        error.response?.data || { error: "Request failed" },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}