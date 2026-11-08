export default function PhoneStatusBar({ variant = 'phone', showDot = false }) {
  const barClass = variant === 'detail' ? 'detail-statusbar' : 'phone-topbar';

  return (
    <div className={barClass}>
      <div className="status-time">
        {showDot && <span className="dot" aria-hidden="true" />}
        <span className="status">9:41</span>
      </div>
      <div className="status-icons" aria-label="estado del teléfono">
        <span className="signal" aria-hidden="true">
          <span className="signal-bar short" />
          <span className="signal-bar medium" />
          <span className="signal-bar long" />
        </span>
        <span className="wifi" aria-hidden="true">◔</span>
        <span className="battery" aria-hidden="true">
          <span className="battery-level" />
        </span>
      </div>
    </div>
  );
}