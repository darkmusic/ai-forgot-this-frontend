import { Form, useActionData, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const data = useActionData() as { error?: string } | undefined;
  const [sp] = useSearchParams();
  const redirectTo = sp.get("redirectTo") || "/home";

  return (
    <div>
      <h1>Sign in</h1>
      {data?.error && <p style={{color:"crimson"}}>{data.error}</p>}
      <Form method="post" replace>
        <input type="hidden" name="redirectTo" value={redirectTo}/>
        <input name="username" placeholder="user" className="login-field" />
        <input name="password" type="password" className="login-field" placeholder="••••••" />
        <button type="submit">Login</button>
      </Form>
    </div>
  );
}
