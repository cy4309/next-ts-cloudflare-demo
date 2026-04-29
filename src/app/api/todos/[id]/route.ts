import { NextResponse } from "next/server";

type D1ApiSuccess = {
  success: true;
  result: Array<{
    success: boolean;
    error?: string;
  }>;
};

type D1ApiFailure = {
  success: false;
  errors: Array<{ message: string }>;
};

async function queryD1(
  sql: string,
  params: unknown[] = []
): Promise<{ ok: boolean; error?: string }> {
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

  const payload = (await res.json()) as D1ApiSuccess | D1ApiFailure;
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

  return { ok: true };
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const todoId = Number(id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid todo id",
      },
      { status: 400 }
    );
  }

  const result = await queryD1("DELETE FROM todos WHERE id = ?", [todoId]);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "Failed to delete todo",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const todoId = Number(id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid todo id",
      },
      { status: 400 }
    );
  }

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

  const result = await queryD1("UPDATE todos SET content = ? WHERE id = ?", [
    content,
    todoId,
  ]);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "Failed to update todo",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
