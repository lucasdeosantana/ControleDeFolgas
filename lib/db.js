
// lib/db.js
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente admin (server-side) — usa a service key, segura nas env vars.
 * Não exporte isso para o client, só use dentro de rotas API.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Observação:
 * - No Supabase, as tabelas devem existir. Use o SQL Editor para criar:
 *   colaboradores(id, nome, re UNIQUE, numero, equipe, escala, escala_trabalho CHECK),
 *   ferias(id, colaboradorId FK, start DATE, end DATE),
 *   folgas(id, colaboradorId FK, date DATE).
 * - Se quiser seeds, rode via SQL (não no runtime).
 */

/* =========================
   COLABORADORES (CRUD)
   ========================= */

export async function listCollaborators() {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCollaborator({ nome, re, numero, equipe, escala, escala_trabalho }) {
  if (!nome || !re || !numero || !equipe || !escala || !escala_trabalho) {
    throw new Error('Dados inválidos para colaborador');
  }
  const { data, error } = await supabase
    .from('colaboradores')
    .insert([{ nome, re, numero, equipe, escala, escala_trabalho }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCollaborator(id, body) {
  const { data, error } = await supabase
    .from('colaboradores')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCollaborator(id) {
  const { error } = await supabase
    .from('colaboradores')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/* =========================
   FÉRIAS (CRUD)
   ========================= */

export async function listVacations({ year } = {}) {
  let query = supabase.from('ferias').select('*').order('start', { ascending: true });
  if (year) query = query.gte('start', `${year}-01-01`).lte('start', `${year}-12-31`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createVacation({ colaboradorId, start, end }) {
  if (!colaboradorId || !start || !end) throw new Error('Dados inválidos para férias');
  const { data, error } = await supabase
    .from('ferias')
    .insert([{ colaboradorId, start, end }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVacation(id) {
  const { error } = await supabase
    .from('ferias')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/* =========================
   FOLGAS (CRUD)
   ========================= */

export async function listFolgas({ start, end } = {}) {
  let query = supabase.from('folgas').select('*').order('date', { ascending: true });
  if (start && end) query = query.gte('date', start).lte('date', end);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createFolga({ colaboradorId, date }) {
  if (!colaboradorId || !date) throw new Error('Dados inválidos para folga');
  const { data, error } = await supabase
    .from('folgas')
    .insert([{ colaboradorId, date }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFolga(id) {
  const { error } = await supabase
    .from('folgas')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
