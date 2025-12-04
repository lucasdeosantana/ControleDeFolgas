
import {
  listCollaborators, createCollaborator,
  updateCollaborator, deleteCollaborator
} from '../../../lib/db';

export async function GET() {
  try {
    const data = await listCollaborators();
    return Response.json(data);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const data = await createCollaborator(body);
    return Response.json({ ok: true, data });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
    const body = await req.json();
    const data = await updateCollaborator(id, body);
    return Response.json({ ok: true, data });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return new Response(JSON.stringify({ error: 'id obrigatório' }), { status: 400 });
    await deleteCollaborator(id);
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
