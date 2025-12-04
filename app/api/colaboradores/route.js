
import { sql } from '@vercel/postgres';
import { ensureSchema, seedIfEmpty } from '../../../lib/db';

export async function GET() {
  await ensureSchema(); await seedIfEmpty();
  const { rows } = await sql`SELECT * FROM colaboradores ORDER BY nome ASC;`;
  return Response.json(rows);
}

export async function POST(req) {
  await ensureSchema();
  const body = await req.json();
  const { nome, re, numero, equipe, escala, escala_trabalho } = body || {};
  if (!nome || !re || !numero || !equipe || !escala || !escala_trabalho) {
    return new Response(JSON.stringify({ error: 'Dados inválidos' }), { status: 400 });
  }
  const { rows } = await sql`
    INSERT INTO colaboradores (nome,re,numero,equipe,escala,escala_trabalho)
    VALUES (${nome},${re},${numero},${equipe},${escala},${escala_trabalho})
    RETURNING *;
  `;
  return Response.json({ ok: true, data: rows[0] });
}

/**
 * PATCH/DELETE via query string (?id=)
 */
export async function PATCH(req) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
  const body = await req.json();

  const before = await sql`SELECT * FROM colaboradores WHERE id=${id};`;
  if (!before.rows[0]) return new Response(JSON.stringify({ error: 'não encontrado' }), { status: 404 });

  const merged = { ...before.rows[0], ...body };
  const { nome, re, numero, equipe, escala, escala_trabalho } = merged;

  const { rows } = await sql`
    UPDATE colaboradores
    SET nome=${nome}, re=${re}, numero=${numero}, equipe=${equipe},
        escala=${escala}, escala_trabalho=${escala_trabalho}
    WHERE id=${id}
    RETURNING *;
  `;
  return Response.json({ ok: true, data: rows[0] });
}

export async function DELETE(req) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
  await sql`DELETE FROM colaboradores WHERE id=${id};`;
  return Response.json({ ok: true });
}
