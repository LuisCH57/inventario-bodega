// Muestra un error de la API con sus detalles (si los tiene)
export default function ErrorMessage({ error }) {
  if (!error) {
    return null;
  }

  return (
    <div className="alert alert-error" role="alert">
      <strong>{error.message}</strong>
      {error.details?.length > 0 && (
        <ul>
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
