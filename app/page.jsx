'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ESCALAS_TRABALHO, fmtISO, addDays,
  getWeeksOfYear, rangesOverlap, isScheduled
} from '../lib/schedule';

function MiniButton({ children, onClick, variant = 'default', disabled }) {
  const cls = ['btn-mini'];
  if (variant === 'accent') cls.push('accent');
  if (variant === 'danger') cls.push('danger');
  return (
    <button className={cls.join(' ')} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Modal({ open, title, children, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" style={{ display:'flex' }}>
      <div className="modal-content">
        <h3 className="modal-title">{title}</h3>
        <div>{children}</div>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="accent" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  // ----------------- Estado base -----------------
  const [year, setYear] = useState(new Date().getFullYear());
  const weeks = useMemo(() => getWeeksOfYear(year), [year]);

  const [collabs, setCollabs] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [folgas, setFolgas] = useState([]);
  const [anchorISO, setAnchorISO] = useState('2024-12-24');

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // Semana selecionada
  const [selectedWeek, setSelectedWeek] = useState(null);
  const showWeekly = !!selectedWeek;

  // ----------------- Modal: Férias -----------------
  const [vacOpen, setVacOpen] = useState(false);
  const [vacForm, setVacForm] = useState({ colaboradorId: null, startISO: '', endISO: '' });

  // ----------------- Modal: Configurar escalas -----------------
  const [cfgOpen, setCfgOpen] = useState(false);

  // ----------------- Fetch helpers -----------------
  async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function loadAll() {
    try {
      setLoading(true); setErrMsg('');
      const [c, v] = await Promise.all([
        fetchJSON('/api/colaboradores'),
        fetchJSON(`/api/ferias?year=${year}`)
      ]);
      setCollabs(c); setVacations(v);
    } catch (e) {
      setErrMsg(`Falha ao carregar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadFolgasWeek(startISO, endISO) {
    try {
      const f = await fetchJSON(`/api/folgas?start=${startISO}&end=${endISO}`);
      setFolgas(f);
    } catch (e) {
      setErrMsg(`Falha ao carregar folgas: ${e.message}`);
    }
  }

  useEffect(() => { loadAll(); }, [year]);

  // ----------------- Ações semana -----------------
  async function addFolga(colaboradorId, dateISO) {
    try {
      const { data } = await fetchJSON('/api/folgas', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ colaboradorId, date: dateISO })
      });
      setFolgas(prev => [...prev, data]);
    } catch (e) {
      alert(e.message.includes('Já existe folga') ? 'Já existe folga nessa data' : e.message);
    }
  }

  async function removeFolga(folgaId) {
    try {
      await fetchJSON(`/api/folgas?id=${folgaId}`, { method: 'DELETE' });
      setFolgas(prev => prev.filter(f => f.id !== folgaId));
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeVacationFor(colaboradorId, dayISO) {
    const hit = vacations.find(v => v.colaboradorId === colaboradorId && rangesOverlap(v.start, v.end, dayISO, dayISO));
    if (!hit) return;
    try {
      await fetchJSON(`/api/ferias?id=${hit.id}`, { method: 'DELETE' });
      setVacations(prev => prev.filter(v => v.id !== hit.id));
    } catch (e) {
      alert(e.message);
    }
  }

  // ----------------- Render visão anual -----------------
  function YearView() {
    return (
      <div className="grid-container">
        <table>
          <thead>
            <tr>
              <th className="name-col">Colaborador</th>
              {weeks.map((w, idx) => (
                <th key={w.start} className="week-col">
                  <div>{`S${String(idx + 1).padStart(2, '0')}`}</div>
                  <div className="week-header">{w.start} → {w.end}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collabs.map(col => (
              <tr key={col.id}>
                <th className="name-col">{col.nome}</th>
                {weeks.map((w, idx) => {
                  const hasVacation = vacations.some(v => v.colaboradorId === col.id && rangesOverlap(v.start, v.end, w.start, w.end));
                  return (
                    <td
                      key={w.start}
                      className={`week-col ${hasVacation ? 'cell-vac' : ''}`}
                      title={`${col.nome} / S${idx+1} (${w.start} a ${w.end})`}
                      onClick={() => {
                        setSelectedWeek({ ...w, idx });
                        loadFolgasWeek(w.start, w.end);
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ----------------- Render visão semanal -----------------
  function WeeklyView() {
    if (!showWeekly) return null;
    const startDate = new Date(selectedWeek.start);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <section id="weeklySection" className="weekly active">
        <div className="weekly-header">
          <div><strong>Semana:</strong> <span>{selectedWeek.start} → {selectedWeek.end} (S{selectedWeek.idx+1})</span></div>
          <div className="tools">
            <button onClick={() => {
              const defaultColId = collabs[0]?.id ?? null;
              setVacForm({
                colaboradorId: defaultColId,
                startISO: selectedWeek?.start || '',
                endISO: selectedWeek?.end || ''
              });
              setVacOpen(true);
            }}>
              Adicionar férias
            </button>
          </div>
        </div>

        <div className="week-days">
          {days.map(d => {
            const dayISO = fmtISO(d);
            const metrics = {
              escalados: 0, ferias: 0, folgas: 0, disponiveis: 0,
              porEscala: { ALT_A: 0, ALT_B: 0, DOM_QUI: 0 }
            };
            const list = [];

            collabs.forEach(col => {
              const esc = col.escala_trabalho || ESCALAS_TRABALHO.DOM_QUI;
              const scheduled = isScheduled(dayISO, esc, anchorISO);
              const onVacation = vacations.some(v => v.colaboradorId === col.id && rangesOverlap(v.start, v.end, dayISO, dayISO));
              const folgaRec = folgas.find(f => f.colaboradorId === col.id && f.date === dayISO);
              const hasFolga = !!folgaRec;

              if (scheduled) {
                metrics.escalados++;
                if (esc === ESCALAS_TRABALHO.ALT_A) metrics.porEscala.ALT_A++;
                else if (esc === ESCALAS_TRABALHO.ALT_B) metrics.porEscala.ALT_B++;
                else metrics.porEscala.DOM_QUI++;
                if (onVacation) metrics.ferias++;
                else if (hasFolga) metrics.folgas++;
                else metrics.disponiveis++;
                list.push({ col, onVacation, hasFolga, folgaRec, esc });
              }
            });

            return (
              <div key={dayISO} className="day-card">
                <h4>{d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</h4>

                <div className="day-metrics">
                  <div className="row"><span>Total escalados</span><strong>{metrics.escalados}</strong></div>
                  <div className="row"><span>Em férias</span><strong>{metrics.ferias}</strong></div>
                  <div className="row"><span>Em folga</span><strong>{metrics.folgas}</strong></div>
                  <div className="row"><span>Disponíveis</span><strong>{metrics.disponiveis}</strong></div>
                  <div className="row"><span>Escala C</span><strong>{metrics.porEscala.ALT_A}</strong></div>
                  <div className="row"><span>Escala D</span><strong>{metrics.porEscala.ALT_B}</strong></div>
                  <div className="row"><span>Dom‑Qui</span><strong>{metrics.porEscala.DOM_QUI}</strong></div>
                </div>

                {list.sort((a,b)=> a.col.nome.localeCompare(b.col.nome)).map(item => (
                  <div key={`${dayISO}-${item.col.id}`} className="person">
                    <div>{item.col.nome}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span className={`badge ${item.onVacation ? 'vac' : (item.hasFolga ? 'folga' : '')}`}>
                        {item.onVacation ? 'Férias' : (item.hasFolga ? 'Folga' : 'Disp.')}
                      </span>

                      {item.onVacation ? (
                        <>
                          <MiniButton variant="danger" onClick={() => removeVacationFor(item.col.id, dayISO)}>
                            Remover férias
                          </MiniButton>
                          <MiniButton disabled>—</MiniButton>
                        </>
                      ) : item.hasFolga ? (
                        <MiniButton variant="danger" onClick={() => removeFolga(item.folgaRec.id)}>
                          Remover folga
                        </MiniButton>
                      ) : (
                        <MiniButton variant="accent" onClick={() => addFolga(item.col.id, dayISO)}>
                          + Folga
                        </MiniButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ----------------- Confirmar férias -----------------
  async function confirmVacation() {
    const { colaboradorId, startISO, endISO } = vacForm;
    if (!colaboradorId || !startISO || !endISO) {
      alert('Informe colaborador e datas válidas.'); return;
    }
    try {
      const { data } = await fetchJSON('/api/ferias', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ colaboradorId, start: startISO, end: endISO })
      });
      setVacations(prev => [...prev, data]);
      setVacOpen(false);
    } catch (e) {
      alert(e.message.includes('sobreposto') ? 'Período de férias sobreposto' : e.message);
    }
  }

  function addDaysShortcut(n) {
    if (!vacForm.startISO) { alert('Defina a data de início primeiro.'); return; }
    const start = new Date(vacForm.startISO);
    const end   = new Date(start.getTime() + (n - 1) * 86400000);
    setVacForm(f => ({ ...f, endISO: end.toISOString().slice(0,10) }));
  }

  // ----------------- Confirmar configurações de escalas -----------------
  async function confirmConfig() {
    try {
      // Atualiza âncora (só estado local; se quiser persistir, crie coluna no banco)
      // setAnchorISO(anchorISO) já setado pelo input controlado.
      // Atualiza escalas via PATCH para cada colaborador (apenas se mudou)
      // (Aqui, como não temos rastreamento de "mudou", vamos manter simples: recarregar após o modal)
      await loadAll();
      setCfgOpen(false);
    } catch (e) {
      alert(e.message);
    }
  }

  // ----------------- Render -----------------
  return (
    <>
      <header>
        <div className="left">
          <strong>Gestão de Férias e Folgas Sinalização Noturna</strong>
          <label>Ano:&nbsp;
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[year-1, year, year+1, year+2].map(yy => <option key={yy} value={yy}>{yy}</option>)}
            </select>
          </label>
          <button className="accent" onClick={loadAll}>Recarregar</button>
          <button className="accent" onClick={() => setSelectedWeek(s => s ? null : weeks[0])}>
            {showWeekly ? 'Fechar semanal' : 'Visão semanal'}
          </button>
        </div>
        <div className="right">
          <button> <Link href="/colaboradores">(Em desenvolvimento)</Link></button>
          <button onClick={() => setCfgOpen(true)}>Configurar escalas</button>
        </div>
      </header>

      <main>
        {errMsg && (
          <div style={{ background:'#7f1d1d', border:'1px solid #b91c1c', color:'#fecaca', borderRadius:8, padding:8, marginBottom:8 }}>
            {errMsg}
          </div>
        )}
        <div className="legend"><span>🟢 Férias</span><span>🟠 Folga</span></div>
        {loading ? <div>Carregando...</div> : <YearView />}
        {showWeekly && <WeeklyView />}
      </main>

      {/* Modal: Férias */}
      <Modal
        open={vacOpen}
        title="Adicionar férias"
        onConfirm={confirmVacation}
        onCancel={() => setVacOpen(false)}
      >
        <div style={{ display:'grid', gap:8 }}>
          <label>Colaborador:
            <select
              value={vacForm.colaboradorId ?? ''}
              onChange={e => setVacForm(f => ({ ...f, colaboradorId: Number(e.target.value) }))}
            >
              {collabs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label>Início:
            <input type="date" value={vacForm.startISO} onChange={e => setVacForm(f => ({ ...f, startISO: e.target.value }))} />
          </label>
          <label>Término:
            <input type="date" value={vacForm.endISO} onChange={e => setVacForm(f => ({ ...f, endISO: e.target.value }))} />
          </label>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ color:'var(--muted)', fontSize:12 }}>Atalhos:</span>
            <MiniButton variant="accent" onClick={() => addDaysShortcut(20)}>+20 dias</MiniButton>
            <MiniButton variant="accent" onClick={() => addDaysShortcut(30)}>+30 dias</MiniButton>
          </div>
        </div>
      </Modal>

      {/* Modal: Configurar escalas (com rolagem) */}
      <Modal
        open={cfgOpen}
        title="Configurar escalas de trabalho"
        onConfirm={confirmConfig}
        onCancel={() => setCfgOpen(false)}
      >
        <div style={{ display:'grid', gap:10 }}>
          {/* <label>Âncora do ciclo (2x2x3x2x2x3):
            <input type="date" value={anchorISO} onChange={e => setAnchorISO(e.target.value)} />
          </label> */}
          <hr style={{ borderColor:'var(--border)' }} />
          {collabs.map(c => (
            <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:8, alignItems:'center' }}>
              <div>{c.nome}</div>
              <select
                value={c.escala_trabalho || ESCALAS_TRABALHO.DOM_QUI}
                onChange={async (e) => {
                  const escala_trabalho = e.target.value;
                  // PATCH por colaborador
                  try {
                    await fetchJSON(`/api/colaboradores?id=${c.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type':'application/json' },
                      body: JSON.stringify({ escala_trabalho })
                    });
                    // Atualiza localmente para refletir imediatamente
                    setCollabs(prev => prev.map(x => x.id === c.id ? { ...x, escala_trabalho } : x));
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                <option value={ESCALAS_TRABALHO.ALT_A}>Escala C (2x2x3x2x2x3)</option>
                <option value={ESCALAS_TRABALHO.ALT_B}>Escala D (2x2x3x2x2x3)</option>
                <option value={ESCALAS_TRABALHO.DOM_QUI}>Dom‑Qui</option>
              </select>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
