
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ESCALAS_TRABALHO, fmtISO, addDays,
  getWeeksOfYear, rangesOverlap, isScheduled
} from '../lib/schedule';

export default function PlannerPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const weeks = useMemo(() => getWeeksOfYear(year), [year]);

  const [collabs, setCollabs] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [folgas, setFolgas] = useState([]);
  const [anchorISO, setAnchorISO] = useState('2025-01-01');

  const [selectedWeek, setSelectedWeek] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState(null);
  const [vacInputs, setVacInputs] = useState({ colaboradorId: null, startISO: '', endISO: '' });

  async function fetchAll() {
    const [cRes, vRes] = await Promise.all([
      fetch('/api/colaboradores'),
      fetch(`/api/ferias?year=${year}`)
    ]);
    const [c, v] = await Promise.all([cRes.json(), vRes.json()]);
    setCollabs(c); setVacations(v);
  }

  async function fetchFolgasWeek(startISO, endISO) {
    const res = await fetch(`/api/folgas?start=${startISO}&end=${endISO}`);
    setFolgas(await res.json());
  }

  useEffect(() => { fetchAll(); }, [year]);

  function renderYearView() {
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
                        fetchFolgasWeek(w.start, w.end);
                        const el = document.getElementById('weeklySection');
                        if (el) el.classList.add('active');
                        document.getElementById('weeklyRange').textContent = `${w.start} → ${w.end} (S${idx+1})`;
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

  async function removeVacationFor(colaboradorId, dayISO) {
    const hit = vacations.find(v => v.colaboradorId === colaboradorId && rangesOverlap(v.start, v.end, dayISO, dayISO));
    if (!hit) return;
    await fetch(`/api/ferias?id=${hit.id}`, { method: 'DELETE' });
    setVacations(prev => prev.filter(v => v.id !== hit.id));
  }

  async function addFolga(colaboradorId, dateISO) {
    const res = await fetch('/api/folgas', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ colaboradorId, date: dateISO })
    });
    const { data } = await res.json();
    setFolgas(prev => [...prev, data]);
  }

  async function removeFolga(folgaId) {
    await fetch(`/api/folgas?id=${folgaId}`, { method: 'DELETE' });
    setFolgas(prev => prev.filter(f => f.id !== folgaId));
  }

  function WeeklyView() {
    if (!selectedWeek) return null;
    const startDate = new Date(selectedWeek.start);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <section id="weeklySection" className="weekly active">
        <div className="weekly-header">
          <div><strong>Semana:</strong> <span id="weeklyRange">{selectedWeek.start} → {selectedWeek.end} (S{selectedWeek.idx+1})</span></div>
          <div className="tools">
            <button id="openVacationModalBtn" onClick={openVacationModal}>Adicionar férias</button>
          </div>
        </div>
        <div className="week-days" id="weekDays">
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
                  <div className="row"><span>ALT A</span><strong>{metrics.porEscala.ALT_A}</strong></div>
                  <div className="row"><span>ALT B</span><strong>{metrics.porEscala.ALT_B}</strong></div>
                  <div className="row"><span>Dom‑Qui</span><strong>{metrics.porEscala.DOM_QUI}</strong></div>
                </div>

                {list.sort((a,b)=> a.col.nome.localeCompare(b.col.nome)).map(item => (
                  <div key={item.col.id} className="person">
                    <div>{item.col.nome} ({item.esc})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${item.onVacation ? 'vac' : (item.hasFolga ? 'folga' : '')}`}>
                        {item.onVacation ? 'Férias' : (item.hasFolga ? 'Folga' : 'Disp.')}
                      </span>

                      {item.onVacation ? (
                        <>
                          <button className="btn-mini danger"
                            title="Remove o período de férias que inclui este dia"
                            onClick={() => removeVacationFor(item.col.id, dayISO)}>
                            Remover férias
                          </button>
                          <button className="btn-mini" disabled>—</button>
                        </>
                      ) : item.hasFolga ? (
                        <button className="btn-mini danger" onClick={() => removeFolga(item.folgaRec.id)}>
                          Remover folga
                        </button>
                      ) : (
                        <button className="btn-mini accent" onClick={() => addFolga(item.col.id, dayISO)}>
                          + Folga
                        </button>
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

  // Modals
  function openVacationModal() {
    const defaultColId = collabs[0]?.id ?? null;
    setVacInputs({
      colaboradorId: defaultColId,
      startISO: selectedWeek?.start || '',
      endISO: selectedWeek?.end || ''
    });

    const backdrop = document.getElementById('modalBackdrop');
    document.getElementById('modalTitle').textContent = 'Adicionar férias';
    document.getElementById('modalBody').innerHTML = `
      <div style="display:grid; gap:8px;">
        <label>Colaborador:
          <select id="vacCol">
            ${collabs.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
          </select>
        </label>
        <label>Início: <input type="date" id="vacStart" value="${selectedWeek?.start || ''}"></label>
        <label>Término: <input type="date" id="vacEnd" value="${selectedWeek?.end || ''}"></label>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="color:var(--muted); font-size:12px;">Atalhos:</span>
          <button id="add20Btn" class="btn-mini accent" type="button">+20 dias</button>
          <button id="add30Btn" class="btn-mini accent" type="button">+30 dias</button>
        </div>
      </div>
    `;
    backdrop.style.display = 'flex';

    document.getElementById('add20Btn').onclick = () => addDaysToEnd(20);
    document.getElementById('add30Btn').onclick = () => addDaysToEnd(30);
    document.getElementById('modalOk').onclick = confirmVacationModal;
    document.getElementById('modalCancel').onclick = closeModal;
  }

  function addDaysToEnd(n) {
    const startISO = document.getElementById('vacStart').value;
    if (!startISO) return alert('Defina a data de início primeiro.');
    const start = new Date(startISO);
    const end   = new Date(start.getTime() + (n - 1) * 86400000);
    document.getElementById('vacEnd').value = end.toISOString().slice(0,10);
  }

  async function confirmVacationModal() {
    const colaboradorId = Number(document.getElementById('vacCol').value);
    const startISO = document.getElementById('vacStart').value;
    const endISO   = document.getElementById('vacEnd').value;
    if (!colaboradorId || !startISO || !endISO) return alert('Informe colaborador e datas válidas.');

    const res = await fetch('/api/ferias', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ colaboradorId, start: startISO, end: endISO })
    });
    const { data } = await res.json();
    setVacations(prev => [...prev, data]);
    closeModal();
  }

  function closeModal() {
    const backdrop = document.getElementById('modalBackdrop');
    backdrop.style.display = 'none';
    document.getElementById('modalOk').onclick = null;
    document.getElementById('modalCancel').onclick = null;
  }

  function openConfigModal() {
    const backdrop = document.getElementById('modalBackdrop');
    document.getElementById('modalTitle').textContent = 'Configurar escalas';
    document.getElementById('modalBody').innerHTML = `
      <div style="display:grid; gap:10px;">
        <label>Âncora do ciclo (2x2x3x2x2x3):
          <input type="date" id="anchorInput" value="${anchorISO}">
        </label>
        <hr style="border-color:#374151; margin:0;">
        ${collabs.map(c=>`
          <div style="display:grid; grid-template-columns: 1fr 220px; gap:8px; align-items:center;">
            <div>${c.nome}</div>
            <select data-col-id="${c.id}" class="escSelect">
              <option value="${ESCALAS_TRABALHO.ALT_A}" ${c.escala_trabalho===ESCALAS_TRABALHO.ALT_A?'selected':''}>ALT A (2x2x3x2x2x3)</option>
              <option value="${ESCALAS_TRABALHO.ALT_B}" ${c.escala_trabalho===ESCALAS_TRABALHO.ALT_B?'selected':''}>ALT B (2x2x3x2x2x3)</option>
              <option value="${ESCALAS_TRABALHO.DOM_QUI}" ${c.escala_trabalho===ESCALAS_TRABALHO.DOM_QUI?'selected':''}>Dom‑Qui</option>
            </select>
          </div>`).join('')}
      </div>
    `;
    backdrop.style.display='flex';

    document.getElementById('modalOk').onclick = async () => {
      const newAnchor = document.getElementById('anchorInput').value;
      if (newAnchor) setAnchorISO(newAnchor);
      const selects = [...document.querySelectorAll('.escSelect')];
      for (const s of selects) {
        const id = Number(s.getAttribute('data-col-id'));
        const esc = s.value;
        await fetch(`/api/colaboradores?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ escala_trabalho: esc })
        });
      }
      await fetchAll(); closeModal();
    };
    document.getElementById('modalCancel').onclick = closeModal;
  }

  return (
    <>
      <header>
        <div className="left">
          <strong>Gestão de Férias e Folgas (MEF L9C)</strong>
          <label>Ano:&nbsp;
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[year-1, year, year+1, year+2].map(yy => <option key={yy} value={yy}>{yy}</option>)}
            </select>
          </label>
          <button className="accent" onClick={() => fetchAll()}>Recarregar</button>
          <button className="accent" onClick={() => {
            const el = document.getElementById('weeklySection');
            if (el) el.classList.toggle('active');}}>Visão semanal</button>
        </div>
        <div className="right">
          /colaboradoresEditar colaboradores →</Link>
          <button id="openConfigEscalasBtn" onClick={openConfigModal}>Configurar escalas</button>
        </div>
      </header>

      <main>
        <div className="legend"><span>🟢 Férias</span><span>🟠 Folga</span></div>
        {renderYearView()}
        <WeeklyView />
      </main>

      {/* Modal com rolagem */}
      <div id="modalBackdrop" className="modal-backdrop">
        <div className="modal-content">
          <h3 id="modalTitle" className="modal-title">Ação</h3>
          <div id="modalBody"></div>
          <div className="modal-actions">
            <button id="modalCancel">Cancelar</button>
            <button id="modalOk" className="accent">Confirmar</button>
          </div>
        </div>
      </div>
    </>
  );
}
