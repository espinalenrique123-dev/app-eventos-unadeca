const EventSubject = require('../src/observer/EventSubject');
const PushNotificationObserver = require('../src/observer/PushNotificationObserver');
const { construirNotificacion, debeEnviarRecordatorio } = require('../src/notifications');

const base = { nombre: 'Feria Tecnológica', fecha: '2026-11-20', hora: '09:00', lugar: 'Auditorio', estado: 'PUBLICADO' };

describe('construirNotificacion (RF-02, RF-03)', () => {
  test('CP-F-01 [RF-03] avisa a los inscritos cuando el evento se elimina (cancela)', () => {
    expect(construirNotificacion(base, { ...base, estado: 'CANCELADO' })).toMatchObject({ tipo: 'CANCELADO' });
  });
  test('CP-F-02 [RF-02] avisa cuando cambian fecha, hora o lugar', () => {
    const n = construirNotificacion(base, { ...base, lugar: 'Capilla', hora: '10:00' });
    expect(n.tipo).toBe('MODIFICADO');
    expect(n.cuerpo).toContain('la hora, el lugar');
  });
  test('CP-F-03 [RF-02] no avisa si solo cambian los cupos', () => {
    expect(construirNotificacion(base, { ...base, cuposOcupados: 5, estado: 'CUPO_LLENO' })).toBeNull();
  });
});

describe('debeEnviarRecordatorio (RF-10)', () => {
  const ahora = new Date('2026-11-19T15:00:00Z'); // 09:00 en Costa Rica, 24 h antes
  test('CP-F-04 [RF-10] sí, si faltan ~24 h', () => expect(debeEnviarRecordatorio(base, ahora)).toBe(true));
  test('CP-F-05 [RF-10] no, si ya se envió', () => expect(debeEnviarRecordatorio({ ...base, recordatorioEnviado: true }, ahora)).toBe(false));
  test('CP-F-06 [RF-10] no, si faltan 48 h', () => expect(debeEnviarRecordatorio({ ...base, fecha: '2026-11-21' }, ahora)).toBe(false));
  test('CP-F-07 [RF-10] no, si está cancelado', () => expect(debeEnviarRecordatorio({ ...base, estado: 'CANCELADO' }, ahora)).toBe(false));
});

describe('EventSubject — patrón Observer', () => {
  test('CP-F-08 [RNF-Confiabilidad] el sujeto notifica a todos los observadores aunque uno falle', async () => {
    const s = new EventSubject();
    const ok = { update: jest.fn().mockResolvedValue('ok') };
    const falla = { update: jest.fn().mockRejectedValue(new Error('x')) };
    s.subscribe(falla);
    s.subscribe(ok);
    const r = await s.notify({ eventId: 'e1' });
    expect(ok.update).toHaveBeenCalledWith({ eventId: 'e1' });
    expect(r.map((x) => x.status)).toEqual(['rejected', 'fulfilled']);
  });

  test('CP-F-09 [RNF-Mantenibilidad] rechaza observadores sin update()', () => {
    expect(() => new EventSubject().subscribe({})).toThrow(TypeError);
  });
});

describe('PushNotificationObserver', () => {
  test('CP-F-10 [RF-10] envía solo a tokens de inscripciones activas, sin duplicados', async () => {
    const docs = ['a', 'b', 'a', null].map((t) => ({ get: () => t }));
    const query = { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ docs }) };
    const db = { collection: jest.fn().mockReturnValue(query) };
    const messaging = { sendEachForMulticast: jest.fn().mockResolvedValue({ successCount: 2, failureCount: 0 }) };
    const obs = new PushNotificationObserver(db, messaging, { info: jest.fn(), warn: jest.fn() });

    const r = await obs.update({ eventId: 'e1', notificacion: { tipo: 'CANCELADO', titulo: 't', cuerpo: 'c' } });

    expect(query.where).toHaveBeenCalledWith('estado', '==', 'ACTIVA');
    expect(messaging.sendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({ tokens: ['a', 'b'] }));
    expect(r.enviados).toBe(2);
  });
});
