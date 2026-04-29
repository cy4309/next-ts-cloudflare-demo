import { NextResponse } from "next/server";

type Todo = {
  id: number;
  content: string;
  created_at: string;
};

type D1ApiSuccess<T> = {
  success: true;
  result: Array<{
    success: boolean;
    results?: T[];
    error?: string;
    meta?: {
      last_row_id?: number;
    };
  }>;
};

type D1ApiFailure = {
  success: false;
  errors: Array<{ message: string }>;
};

async function queryD1<T>(
  sql: string,
  params: unknown[] = []
): Promise<{ ok: boolean; results?: T[]; lastRowId?: number; error?: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !token) {
    return {
      ok: false,
      error:
        "Missing D1 env vars. Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN",
    };
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sql,
      params,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      ok: false,
      error: `D1 API HTTP ${res.status}`,
    };
  }

  const payload = (await res.json()) as D1ApiSuccess<T> | D1ApiFailure;
  if (!payload.success) {
    return {
      ok: false,
      error: payload.errors[0]?.message ?? "Unknown D1 API error",
    };
  }

  const row = payload.result[0];
  if (!row?.success) {
    return {
      ok: false,
      error: row?.error ?? "D1 query failed",
    };
  }

  return {
    ok: true,
    results: row.results ?? [],
    lastRowId: row.meta?.last_row_id,
  };
}

export async function GET() {
  const query = await queryD1<Todo>(
    "SELECT id, content, created_at FROM todos ORDER BY id DESC"
  );
  if (!query.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: query.error ?? "Failed to query todos",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    todos: query.results ?? [],
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json(
      {
        ok: false,
        error: "content is required",
      },
      { status: 400 }
    );
  }

  const insertResult = await queryD1(
    "INSERT INTO todos (content, created_at) VALUES (?, datetime('now'))",
    [content]
  );
  if (!insertResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: insertResult.error ?? "Failed to insert todo",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: insertResult.lastRowId ?? null,
  });
}
