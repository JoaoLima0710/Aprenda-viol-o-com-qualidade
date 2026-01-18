import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🚀 Iniciando MusicTutor...");

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Elemento #root não encontrado");
  }

  console.log("📱 Renderizando aplicação...");
  createRoot(rootElement).render(<App />);
  console.log("✅ MusicTutor carregado com sucesso!");
} catch (error) {
  console.error("❌ Erro ao carregar MusicTutor:", error);
  // Fallback: mostrar mensagem de erro na tela
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center; color: #ef4444;">
        <h1>Erro ao carregar MusicTutor</h1>
        <p>${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <button onclick="location.reload()">Tentar Novamente</button>
      </div>
    </div>
  `;
}
