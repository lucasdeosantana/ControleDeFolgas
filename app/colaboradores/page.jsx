
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ColabsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');

  async function load() {
    const res = await fetch('/api/colaboradores');
    setRows(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function save(c) {
    const { id, nome, re, numero, equipe, escala, escala_trabalho } = c;
    const res = await fetch(`/api/colaboradores?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ nome, re, numero, equipe, escala, escala_trabalho })
    });
    const js = await res.json();
    if (!js.ok) alert('Falha ao salvar'); else load();
  }

  async function add() {
    const novo = {
      nome: 'Novo colaborador',
      re: `00-${String(Math.floor(Math.random()*90000)+10000)}`,
      numero: String(Math.floor(Math.random()*90000)+10000),
      equipe: 'MEF L9C',
      escala: '',
      escala_trabalho: 'DOM-QUI'
    };
    const res = await fetch('/api/colaboradores', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(novo)
    });
    const js = await res.json();
    if (!js.ok) alert('Falha ao criar'); else load();
  }

  async function del(id, nome) {
    if (!confirm(`Excluir ${nome}?`)) return;
    const res = await fetch(`/api/colaboradores?id=${id}`, { method: 'DELETE' });
    const js = await res.json();
    if (!js.ok) alert('Falha ao excluir'); else load();
  }

  const filtered = rows.filter(c => {
    const nome=(c.nome||'').toLowerCase();
    const re=(c.re||'').toLowerCase();
    const numero=(c.numero||'').toLowerCase();
    const term = (q||'').toLowerCase();
    return !term || nome.includes(term) || re.includes(term) || numero.includes(term);
  }).sort((a,b)=> a.nome.localeCompare(b.nome));

  return (
    <>
      <header>
        <div className="left"><strong>Colaboradores (MEF L9C)</strong></div>
        <div className="right">/← Voltar para planejamento</Link></div>
      </header>

      <main>
        <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <button className="accent" onClick={add}>+ Novo colaborador</button>
            <input placeholder="Buscar por nome, RE ou número..." value={q} onChange={e=> setQ(e.target.value)} />
          </div>

          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>Nome</th>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>RE</th>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>Número</th>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>Equipe</th>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>Escala (supervisão)</th>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>Escala de trabalho</th>
                <th style={{ borderBottom:'1px solid var(--border)', padding:8 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                    <input value={c.nome||''} onChange={e=> c.nome=e.target.value} />
                  </td>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                    <input value={c.re||''} onChange={e=> c.re=e.target.value} />
                  </td>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                    <input value={c.numero||''} onChange={e=> c.numero=e.target.value} />
                  </td>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                    <input value={c.equipe||'MEF L9C'} onChange={e=> c.equipe=e.target.value} />
                  </td>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                    <input value={c.escala||''} onChange={e=> c.escala=e.target.value} />
                  </td>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                    <select defaultValue={c.escala_trabalho||'DOM-QUI'} onChange={e=> c.escala_trabalho=e.target.value}>
                      <option value="2x2x3x2x2x3_A">ALT A (2x2x3x2x2x3)</option>
                      <option value="2x2x3x2x2x3_B">ALT B (2x2x3x2x2x3)</option>
                      <option value="DOM-QUI">Dom‑Qui</option>
                    </select>
                  </td>
                  <td style={{ borderBottom:'1px solid var(--border)', padding:8, display:'flex', gap:6 }}>
                    <button onClick={() => save(c)}>Salvar</button>
                    <button className="btn-mini danger" onClick={() => del(c.id, c.nome)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
