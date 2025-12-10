
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function ColabsPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  async function load() {
    try {
      setLoading(true); setErrMsg('');
      const data = await fetchJSON('/api/colaboradores');
      setRows(data);
    } catch (e) {
      setErrMsg(`Falha ao carregar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(c) {
    const { id, nome, re, numero, equipe, escala, escala_trabalho } = c;
    try {
      const js = await fetchJSON(`/api/colaboradores?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ nome, re, numero, equipe, escala, escala_trabalho })
      });
      if (!js.ok) alert('Falha ao salvar'); else load();
    } catch (e) {
      alert(e.message);
    }
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
    try {
      const js = await fetchJSON('/api/colaboradores', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(novo)
      });
      if (!js.ok) alert('Falha ao criar'); else load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function del(id, nome) {
    if (!confirm(`Excluir ${nome}?`)) return;
    try {
      const js = await fetchJSON(`/api/colaboradores?id=${id}`, { method: 'DELETE' });
      if (!js.ok) alert('Falha ao excluir'); else load();
    } catch (e) {
      alert(e.message);
    }
  }


  var filtered = rows.filter(c => {
    const nome=(c.nome||'').toLowerCase();
    const re=(c.re||'').toLowerCase();
    const numero=(c.numero||'').toLowerCase();
    const term = (q||'').toLowerCase();
    return !term || nome.includes(term) || re.includes(term) || numero.includes(term);
  }).sort((a,b)=> a.nome.localeCompare(b.nome));

  function updateFiltered(id, key, value){
    filtered = filtered.map( c=> {
      c.id === id ? { ...c, [key]: value } : c
    })
  }

  return (
    <>
      <header>
        <div className="left"><strong>Colaboradores</strong></div>
        <div className="right">/← Voltar para planejamento</div>
      </header>

      <main>
        {errMsg && (
          <div style={{ background:'#7f1d1d', border:'1px solid #b91c1c', color:'#fecaca', borderRadius:8, padding:8, marginBottom:8 }}>
            {errMsg}
          </div>
        )}
        <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:8, padding:12 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <button className="accent" onClick={add}>+ Novo colaborador</button>
            <input placeholder="Buscar por nome, RE ou número..." value={q} onChange={e=> setQ(e.target.value)} />
          </div>

          {loading ? <div>Carregando...</div> : (
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
                      <input value={c.nome||''} onChange={e=> c.nome=e.target.value}/>
                    </td>
                    <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                      <input value={c.re||''} onChange={e=> c.re=e.target.value} />
                    </td>
                    <td style={{ borderBottom:'1px solid var(--border)', padding:8 }}>
                      <input value={c.numero||''} onChange={e => updateFiltered(c.id, "numero", e.target.value)} />
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
          )}
        </div>
      </main>
    </>
  );
}
