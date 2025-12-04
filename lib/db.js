
// lib/db.js
import { createClient } from '@supabase/supabase-js';

// Admin server — usa service key; não expor em client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

/* COLABORADORES */
export async function listCollaborators() {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('nome', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
export async function createCollaborator(body) {
  const { data, error } = await supabase
    .from('colaboradores')
    .insert([body])
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

/* FÉRIAS */
export async function listVacations({ year } = {}) {
  let q = supabase.from('ferias').select('*').order('start', { ascending: true });
  if (year) q = q.gte('start', `${year}-01-01`).lte('start', `${year}-12-31`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}
export async function createVacation({ colaboradorId, start, end }) {
  const { data, error } = await supabase
    .from('ferias')
    .insert([{ colaboradorId, start, end }])
    .select()
    .single();
  if (error) throw new Error(error.message); // ex.: sobreposição gera erro 409 interno do Postgres
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

/* FOLGAS */
export async function listFolgas({ start, end } = {}) {
  let q = supabase.from('folgas').select('*').order('date', { ascending: true });
  if (start && end) q = q.gte('date', start).lte('date', end);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}
export async function createFolga({ colaboradorId, date }) {
  const { data, error } = await supabase
    .from('folgas')
    .insert([{ colaboradorId, date }])
    .select()
    .single();
  if (error) throw new Error(error.message); // unique (colab,date) violação
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
