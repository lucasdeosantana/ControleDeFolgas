
import { listVacations, createVacation, deleteVacation } from '../../../lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year'));
    const data = await listVacations({ year: year || undefined });
    return Response.json(data);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const data = await createVacation(body);
    return Response.json({ ok: true, data });
  } catch (err) {
    // se ferias_no_overlap falhar, retorna 409
    const isOverlap = /constraint.*ferias_no_overlap/i.test(err.message);
    return new Response(JSON.stringify({ error: isOverlap ? 'Período de férias sobreposto' : err.message }), { status: isOverlap ? 409 : 400 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
    await deleteVacation(id);
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
