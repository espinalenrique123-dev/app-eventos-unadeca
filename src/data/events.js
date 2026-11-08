export function seedEvents() {
  return [
    {
      id: 1,
      title: 'Feria Tecnologica 2026',
      date: '2026-07-28',
      weekdayLabel: 'Lun',
      time: '9:00 AM',
      detailDate: 'Lunes 28 de julio de 2026',
      detailTime: '9:00 AM - 1:00 PM',
      location: 'Auditorio principal',
      detailLocation: 'Auditorio principal, UNADECA',
      category: 'Academico',
      coordinator: 'Ing. Carlos Molina',
      detailType: 'Academico - Tecnologia',
      capacity: 12,
      price: 0,
      description: 'Evento academico donde estudiantes presentan sus proyectos de tecnologia del cuatrimestre ante la comunidad UNADECA.'
    },
    {
      id: 2,
      title: 'Noche Cultural UNADECA',
      date: '2025-08-01',
      time: '6:00 PM',
      location: 'Gimnasio UNADECA',
      category: 'Cultural',
      capacity: 30,
      price: 0,
      description: ''
    },
    {
      id: 3,
      title: 'Torneo Deportivo',
      date: '2025-08-02',
      time: '8:00 AM',
      location: 'Cancha principal',
      category: 'Deportivo',
      capacity: 0,
      price: 0,
      description: ''
    }
  ];
}

export function formatEventDate(event) {
  const date = new Date(`${event.date}T00:00:00Z`);
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const label = `${event.weekdayLabel || weekdays[date.getUTCDay()]} ${date.getUTCDate()} ${months[date.getUTCMonth()]}`;

  return event.time ? `${label} ${event.time}` : label;
}
