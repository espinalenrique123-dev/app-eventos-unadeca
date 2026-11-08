import PhoneStatusBar from '../components/PhoneStatusBar';

export default function HomePage() {
  const screens = [
    {
      label: 'Pantalla 1 — Inicio de sesión',
      theme: 'login'
    },
    {
      label: 'Pantalla 2 — Lista de eventos',
      theme: 'list'
    },
    {
      label: 'Pantalla 3 — Detalle del evento',
      theme: 'detail'
    },
    {
      label: 'Pantalla 4 — Confirmación de ...',
      theme: 'confirm'
    },
    {
      label: 'Pantalla 5 — Crear nuevo evento',
      theme: 'create'
    },
    {
      label: 'Pantalla 6 — Registro de asistencia',
      theme: 'attendance'
    },
    {
      label: 'Pantalla 7 — Panel coordinador',
      theme: 'manager'
    }
  ];

  return (
    <main className="preview-shell">
      {screens.map((screen) => (
        <div key={screen.label} className="screen-wrapper">
          <div className="screen-label">{screen.label}</div>

          <div className={`mock-phone ${screen.theme}`}>
            <PhoneStatusBar showDot />

            {screen.theme === 'login' && (
              <>
                <div className="login-header">
                  <div className="icon-circle">+</div>
                  <h2>UNADECA</h2>
                  <p>App de Eventos y Actividades</p>
                </div>

                <div className="login-body">
                  <h3>Bienvenido</h3>
                  <label>
                    Correo electrónico
                    <input type="text" value="admin@unadeca.edu.co" readOnly />
                  </label>
                  <label>
                    Contraseña
                    <input type="password" value="admin123" readOnly />
                  </label>
                  <button type="button">Iniciar sesión</button>
                  <small>Continuar con Google</small>
                </div>
              </>
            )}

            {screen.theme === 'list' && (
              <>
                <div className="blue-panel">
                  <div className="mini-header">
                    <span>Eventos disponibles</span>
                    <span className="menu">☰</span>
                  </div>
                  <div className="filter-row">
                    <span>Buscar eventos...</span>
                    <span>⌕</span>
                  </div>
                  <div className="chip-set">
                    <span>Académico</span>
                    <span>Deportivo</span>
                    <span>Cultural</span>
                  </div>
                </div>

                <div className="event-list">
                  <div className="event-item">
                    <h4>Feria Tecnológica 2026</h4>
                    <p>Fecha: 28 jul 2026</p>
                    <p>Lugar: Auditorio principal</p>
                    <button type="button">Ver detalle</button>
                  </div>
                  <div className="event-item muted">
                    <h4>Noche Cultural</h4>
                    <p>Fecha: 4 ago 2026</p>
                    <p>Lugar: Plaza central</p>
                    <button type="button">Ver detalle</button>
                  </div>
                </div>
              </>
            )}

            {screen.theme === 'detail' && (
              <>
                <div className="blue-panel detail-header-box">
                  <span>◀</span>
                  <strong>Feria Tecnológica 2026</strong>
                </div>

                <div className="detail-body">
                  <div className="small-card">
                    <div className="circle-icon">V</div>
                    <div>
                      <p className="soft-label">Inscripción abierta</p>
                    </div>
                  </div>

                  <div className="data-row">
                    <span>Fecha</span>
                    <strong>28 julio 2026</strong>
                  </div>
                  <div className="data-row">
                    <span>Hora</span>
                    <strong>9:00 AM - 1:00 PM</strong>
                  </div>
                  <div className="data-row">
                    <span>Lugar</span>
                    <strong>Auditorio principal</strong>
                  </div>
                  <div className="data-row">
                    <span>Descripción</span>
                    <strong>Evento de innovación y tecnología.</strong>
                  </div>

                  <button type="button" className="primary-cta">Inscribirme</button>
                </div>
              </>
            )}

            {screen.theme === 'confirm' && (
              <div className="confirmation-box">
                <div className="check-badge">✓</div>
                <h3>¡Inscripción confirmada!</h3>
                <p>Tu registro se realizó correctamente.</p>

                <div className="info-box">
                  <span>Resumen de la inscripción</span>
                  <p>Feria Tecnológica 2026</p>
                  <small>28 julio 2026 · 9:00 AM - 1:00 PM</small>
                </div>

                <button type="button">Volver a eventos</button>
              </div>
            )}

            {screen.theme === 'create' && (
              <div className="form-panel">
                <h3>Crear nuevo evento</h3>
                <label>
                  Nombre del evento
                  <input type="text" value="Feria Tecnológica 2026" readOnly />
                </label>
                <div className="inline-fields">
                  <label>
                    Categoría
                    <select defaultValue="Tecnología">
                      <option>Tecnología</option>
                    </select>
                  </label>
                  <label>
                    Fecha
                    <input type="date" value="2026-07-28" readOnly />
                  </label>
                </div>
                <label>
                  Descripción
                  <textarea readOnly>Descripción del evento</textarea>
                </label>
                <div className="cta-row">
                  <button type="button" className="blue-btn">Publicar</button>
                  <button type="button" className="ghost-btn">Cancelar</button>
                </div>
              </div>
            )}

            {screen.theme === 'attendance' && (
              <div className="attendance-panel">
                <h3>Registro de asistencia</h3>
                <div className="attendance-stat">
                  <span>8</span>
                  <small>Total</small>
                </div>

                <div className="person-row">
                  <span>Ana González</span>
                  <span className="toggle active" />
                </div>
                <div className="person-row">
                  <span>Carlos Rodríguez</span>
                  <span className="toggle active" />
                </div>
                <div className="person-row">
                  <span>María López</span>
                  <span className="toggle" />
                </div>

                <button type="button" className="blue-btn">Guardar</button>
              </div>
            )}

            {screen.theme === 'manager' && (
              <div className="manager-panel">
                <div className="manager-header">
                  <span>Panel principal</span>
                  <button type="button">+ Nuevo evento</button>
                </div>

                <h1>Bienvenido, Administrador</h1>

                <div className="stats-inline">
                  <div><strong>3</strong><small>Eventos</small></div>
                  <div><strong>830</strong><small>Capacidad</small></div>
                  <div><strong>Conferencia</strong><small>Próximo</small></div>
                </div>

                <div className="section-label">Eventos registrados</div>

                <div className="event-stack">
                  <div className="mini-event">
                    <span className="small-tag">Tecnología</span>
                    <h4>Conferencia de Tecnología</h4>
                    <p>2026-10-15</p>
                    <p>Bogotá</p>
                    <p>Capacidad: 250</p>
                    <p>Precio: $120.000</p>
                    <div className="row-actions">
                      <button type="button" className="link-btn">Editar</button>
                      <button type="button" className="link-btn danger">Eliminar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
