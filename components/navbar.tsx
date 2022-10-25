export function Navbar() {
  return (
    <div
      style={{
        top: 0,
        left: 0,
        width: '100%',
        height: '8vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: '0.5rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <img src="/mirror.svg" style={{ height: '100%', width: 'auto' }} />

        <h1> Mirror </h1>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <h3 style={{ color: 'grey' }}> by </h3>
        <h1> Sparkl </h1>
        <img
          src="/sparkl_logo.png"
          style={{ height: '100%', width: 'auto', borderRadius: '50%' }}
        />
      </div>
    </div>
  );
}
