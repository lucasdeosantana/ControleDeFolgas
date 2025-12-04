
import { sql } from '@vercel/postgres';
import { ensureSchema } from '../../../lib/db';

export async function GET(req) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year'));
  if (year) {
    const { rows } = await sql`
      SELECT * FROM ferias
      WHERE EXTRACT(YEAR FROM start) = ${year}
      ORDER BY start ASC;
    `;
    return Response.json(rows);
  }
  const { rows } = await sql`SELECT * FROM ferias ORDER BY start ASC;`;
  return Response.json(rows);
}

export async function POST(req) {
  await ensureSchema();
  const body = await req.json();
  const { colaboradorId, start, end } = body || {};
  if (!colaboradorId || !start || !end) {
    return new Response(JSON.stringify({ error: 'dados inválidos' }), { status: 400 });
  }
  const { rows } = await sql`
    INSERT INTO ferias (colaboradorId,start,"end")
    VALUES (${colaboradorId},${start},${end})
    RETURNING *;
  `;
  return Response.json({ ok: true, data: rows[0] });
}

export async function DELETE(req) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
  await sql`DELETE FROM ferias WHERE id=${id};`;
  return Response.json({ ok: true })
