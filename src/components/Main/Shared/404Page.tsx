export default function NotFoundPage() {
  return (
    <div>
      <h1>404 - Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>URL: {window.location.pathname}</p>
      <a href="/home">Go to Home</a>
    </div>
  );
}