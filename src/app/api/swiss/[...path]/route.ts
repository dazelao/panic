import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${API_BASE_URL}/swiss/${params.path.join("/")}`;
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { headers });
  const data = await response.json();

  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${API_BASE_URL}/swiss/${params.path.join("/")}`;
  const body = await request.json();
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${API_BASE_URL}/swiss/${params.path.join("/")}`;
  const body = await request.json();
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const url = `${API_BASE_URL}/swiss/${params.path.join("/")}`;
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "DELETE",
    headers,
  });
  const data = await response.json();

  return NextResponse.json(data);
}