'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ESCALAS_TRABALHO, fmtISO, addDays,
  getWeeksOfYear, rangesOverlap, isScheduled
} from '../../lib/schedule';



export default function PlannerPage() {
  // ----------------- Estado base -----------------
  const [year, setYear] = useState(new Date().getFullYear());
  const weeks = useMemo(() => getWeeksOfYear(year), [year]);

  const [collabs, setCollabs] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [folgas, setFolgas] = useState([]);
  const [anchorISO, setAnchorISO] = useState('2024-12-17');

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // Semana selecionada
  const [selectedWeek, setSelectedWeek] = useState(null);
  const showWeekly = !!selectedWeek;

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

  // ----------------- Render visão anual -----------------
  function YearView() {
    return (
      <div className="grid-container">
        <table>
          <thead>
            <tr>
              <th className="name-col">Escolha a Semana</th>
              {weeks.map((w, idx) => (
                <th key={w.start} className="week-col"
                onClick={() => {
                        setSelectedWeek({ ...w, idx });
                        loadFolgasWeek(w.start, w.end);
                      }}>
                  <div>{`S${String(idx + 1).padStart(2, '0')}`}</div>
                  <div className="week-header">{w.start} → {w.end}</div>
                </th>
              ))}
            </tr>
          </thead>
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
      </header>

      <main>
        {errMsg && (
          <div style={{ background:'#7f1d1d', border:'1px solid #b91c1c', color:'#fecaca', borderRadius:8, padding:8, marginBottom:8 }}>
            {errMsg}
          </div>
        )}
        {loading ? <div>Carregando...</div> : <YearView />}
        {showWeekly && <WeeklyView />}
      </main>
    </>
  );
}
