import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://donetsk1y-tournament.space';

type RouteParams = {
  params: {
    path: string[];
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/swiss${path ? `/${path}` : ''}`, {
    headers,
    method: request.method,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/swiss${path ? `/${path}` : ''}`, {
    headers,
    method: request.method,
    body: request.body
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/swiss${path ? `/${path}` : ''}`, {
    headers,
    method: request.method,
    body: request.body
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/swiss${path ? `/${path}` : ''}`, {
    headers,
    method: request.method
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
} 