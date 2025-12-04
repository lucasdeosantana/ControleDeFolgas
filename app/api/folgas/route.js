
import { sql } from '@vercel/postgres';
import { ensureSchema } from '../../../lib/db';

export async function GET(req) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (start && end) {
    const { rows } = await sql`
      SELECT * FROM folgas
      WHERE date BETWEEN ${start} AND ${end}
      ORDER BY date ASC;
    `;
    return Response.json(rows);
  }
  const { rows } = await sql`SELECT * FROM folgas ORDER BY date ASC;`;
  return Response.json(rows);
}

export async function POST(req) {
  await ensureSchema();
  const body = await req.json();
  const { colaboradorId, date } = body || {};
  if (!colaboradorId || !date) {
    return new Response(JSON.stringify({ error: 'dados inválidos' }), { status: 400 });
  }
  const { rows } = await sql`
    INSERT INTO folgas (colaboradorId,"date")
    VALUES (${colaboradorId},${date})
    RETURNING *;
  `;
  return Response.json({ ok: true, data: rows[0] });
}

export async function DELETE(req) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
  await sql`DELETE FROM folgas WHERE id=${id};`;
  return Response.json({ ok: true })
