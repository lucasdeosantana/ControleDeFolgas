
import { sql } from '@vercel/postgres';

/**
 * Inicializa tabelas (executado no primeiro acesso).
 */
export async function ensureSchema() {
  // colaboradores
  await sql`
    CREATE TABLE IF NOT EXISTS colaboradores (
      id BIGSERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      re TEXT NOT NULL UNIQUE,
      numero TEXT NOT NULL,
      equipe TEXT NOT NULL,
      escala TEXT NOT NULL,
      escala_trabalho TEXT NOT NULL CHECK (escala_trabalho IN ('2x2x3x2x2x3_A','2x2x3x2x2x3_B','DOM-QUI'))
    );
  `;

  // ferias
  await sql`
    CREATE TABLE IF NOT EXISTS ferias (
      id BIGSERIAL PRIMARY KEY,
      colaboradorId BIGINT REFERENCES colaboradores(id) ON DELETE CASCADE,
      start DATE NOT NULL,
      end DATE NOT NULL
    );
  `;

  // folgas
  await sql`
    CREATE TABLE IF NOT EXISTS folgas (
      id BIGSERIAL PRIMARY KEY,
      colaboradorId BIGINT REFERENCES colaboradores(id) ON DELETE CASCADE,
      date DATE NOT NULL
    );
  `;
}

/**
 * Seeds opcionais — chame uma única vez se quiser dados iniciais.
 */
export async function seedIfEmpty() {
  const { rows } = await sql`SELECT COUNT(*)::int AS c FROM colaboradores;`;
  if (rows[0].c > 0) return;

  const base = [
    ['ALVARO GUILHERME','59-00253','20596','MEF L9C','JOELSON LEMES','2x2x3x2x2x3_A'],
    ['ANDRE LUIZ FERREIRA','59-01819','20612','MEF L9C','LUANA CERINO','2x2x3x2x2x3_A'],
    ['BRUNO NASCIMENTO DE JESUS','59-00690','20633','MEF L9C','JOELSON LEMES','2x2x3x2x2x3_A'],
    ['EVANDRO ARTIOLI FELIX','59-03048','22578','MEF L9C','JOELSON LEMES','2x2x3x2x2x3_B'],
    ['JEFFERSON GEORGE','59-03155','22645','MEF L9C','LUANA CERINO','2x2x3x2x2x3_B'],
    ['MARCELO MORAIS DA SILVA','59-00425','20966','MEF L9C','JOELSON LEMES','DOM-QUI'],
    ['WESLEY DE ANDRADE ALMEIDA','59-00164','21165','MEF L9C','JOELSON LEMES','DOM-QUI']
  ];

  for (const [nome,re,numero,equipe,escala,escala_trabalho] of base) {
    await sql`
      INSERT INTO colaboradores (nome,re,numero,equipe,escala,escala_trabalho)
      VALUES (${nome},${re},${numero},${equipe},${escala},${escala_trabalho})
      ON CONFLICT (re) DO NOTHING;
    `;
  }

  // seeds simples de férias/folgas
  await sql`INSERT INTO ferias (colaboradorId,start,"end") VALUES
    ((SELECT id FROM colaboradores WHERE nome='BRUNO NASCIMENTO DE JESUS'),'2026-01-08','2026-01-21'),
    ((SELECT id FROM colaboradores WHERE nome='MARCELO MORAIS DA SILVA'),'2026-03-14','2026-03-27'),
    ((SELECT id FROM colaboradores WHERE nome='JEFFERSON GEORGE'),'2026-07-01','2026-07-20')
  ON CONFLICT DO NOTHING;`;

  await sql`INSERT INTO folgas (colaboradorId,"date") VALUES
    ((SELECT id FROM colaboradores WHERE nome='BRUNO NASCIMENTO DE JESUS'),'2026-01-10'),
    ((SELECT id FROM colaboradores WHERE nome='BRUNO NASCIMENTO DE JESUS'),'2026-01-11'),
    ((SELECT id FROM colaboradores WHERE nome='MARCELO MORAIS DA SILVA'),'2026-03-16')
  ON CONFLICT DO NOTHING;`;
}
