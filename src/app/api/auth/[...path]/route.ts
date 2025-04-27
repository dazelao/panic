import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://donetsk1y-tournament.space';

type Props = {
  params: {
    path: string[]
  }
}

export async function GET(
  request: NextRequest,
  context: Props
) {
  const path = context.params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    headers,
    method: request.method,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function POST(
  request: NextRequest,
  context: Props
) {
  const path = context.params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    headers,
    method: request.method,
    body: request.body
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function PUT(
  request: NextRequest,
  context: Props
) {
  const path = context.params.path.join('/');
  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    headers,
    method: request.method,
    body: request.body
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
} 