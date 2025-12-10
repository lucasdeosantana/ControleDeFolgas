
// app/login/page.jsx
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });

    if (res.ok) {
      window.location.href = "/"; // redireciona para home (ou /dashboard)
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.message || "Falha no login");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "64px auto", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <label>
          Usuário (e-mail ou id)
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="lucas@empresa.com"
            style={{ width: "100%", marginTop: 8, marginBottom: 16 }}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="senha"
            style={{ width: "100%", marginTop: 8, marginBottom: 16 }}
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
