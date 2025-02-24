interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

export const ToggleSwitch = ({ checked, onChange, label }: ToggleSwitchProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div
      onClick={onChange}
      style={{
        position: 'relative',
        width: '44px',
        height: '20px',
        backgroundColor: checked ? 'var(--primary-color)' : 'var(--border-light)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        padding: '2px'
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transform: `translateX(${checked ? '24px' : '0px'})`,
          transition: 'transform 0.3s'
        }}
      />
    </div>
    {label && <span>{label}</span>}
  </div>
);

export default ToggleSwitch; 