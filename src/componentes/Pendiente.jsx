// Tarjeta temporal para pantallas que todavía no se programan.
// El dueño la BORRA de su página cuando empiece a programarla.
export default function Pendiente({ titulo, duenio, rama, children }) {
  return (
    <div className="pendiente">
      <h1>{titulo}</h1>
      <p><b>Dueño:</b> {duenio} · <b>Rama:</b> <code>{rama}</code></p>
      <div>{children}</div>
    </div>
  );
}
