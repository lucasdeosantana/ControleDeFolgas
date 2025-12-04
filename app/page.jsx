
function WeeklyView() {
  if (!selectedWeek) return null;
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

          // Contadores por dia
          const metrics = {
            escalados: 0,
            ferias: 0,
            folgas: 0,
            disponiveis: 0,
            porEscala: { ALT_A: 0, ALT_B: 0, DOM_QUI: 0 }
          };

          // Lista de colaboradores escalados no dia com status
          const scheduledList = collabs.reduce((acc, col) => {
            const esc = col.escala_trabalho || ESCALAS_TRABALHO.DOM_QUI;
            const scheduled = isScheduled(dayISO, esc, anchorISO);

            if (!scheduled) return acc;

            const onVacation = isOnVacationFor(col.id, dayISO, vacations);
            const hasFolga = hasFolgaFor(col.id, dayISO, folgas);

            // incrementa escalados e por escala
            metrics.escalados++;
            if (esc === ESCALAS_TRABALHO.ALT_A) metrics.porEscala.ALT_A++;
            else if (esc === ESCALAS_TRABALHO.ALT_B) metrics.porEscala.ALT_B++;
            else metrics.porEscala.DOM_QUI++;

            // prioridade: férias > folga > disponível
            if (onVacation) {
              metrics.ferias++;
            } else if (hasFolga) {
              metrics.folgas++;
            } else {
              metrics.disponiveis++;
            }

            acc.push({
              col,
              esc,
              onVacation,
              hasFolga,
              folgaRec: hasFolga ? folgas.find(f => f.colaboradorId === col.id && f.date === dayISO) : null
            });
            return acc;
          }, []);

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

              {scheduledList
                .sort((a,b)=> a.col.nome.localeCompare(b.col.nome))
                .map(item => (
                  <div key={`${dayISO}-${item.col.id}`} className="person">
                    <div>{item.col.nome} ({item.esc})</div>
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
