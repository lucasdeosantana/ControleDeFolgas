
import { listFolgas, createFolga, deleteFolga } from '../../../lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const data = await listFolgas({ start, end });
    return Response.json(data);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const data = await createFolga(body);
    return Response.json({ ok: true, data });
  } catch (err) {
    // unique (colaboradorId,date)
    const isDup = /duplicate key value violates unique constraint/i.test(err.message);
    return new Response(JSON.stringify({ error: isDup ? 'Já existe folga nesta data' : err.message }), { status: isDup ? 409 : 400 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
    await deleteFolga(id);
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
