# 🔊 Pull Request — Sistema de Áudio / Treino Musical

## 📌 Descrição
Descreva objetivamente o que este PR altera.

- [ ] Correção
- [ ] Nova funcionalidade
- [ ] Refatoração
- [ ] Infra / CI
- [ ] Documentação

---

## 🎧 Impacto no Sistema de Áudio
Marque tudo que se aplica:

- [ ] Inicialização de áudio
- [ ] Reprodução sonora
- [ ] Percepção auditiva
- [ ] Treino de violão
- [ ] Teoria musical
- [ ] Gamificação
- [ ] Não afeta áudio

👉 Se **afeta áudio**, os itens abaixo são **obrigatórios**.

---

## 🧠 Checklist — Áudio (OBRIGATÓRIO)

### Inicialização e lifecycle
- [ ] Nenhum áudio toca sem interação do usuário
- [ ] Não há múltiplos AudioContexts
- [ ] Áudio para corretamente ao trocar de tela
- [ ] Estado é restaurado corretamente após pausa

### Sincronização
- [ ] Som e UI estão sincronizados
- [ ] Não há atraso perceptível (>50ms)
- [ ] Não existe áudio fora de contexto

### UX sonora
- [ ] Feedback sonoro é previsível
- [ ] Erro ensina, não pune
- [ ] Volume confortável por padrão
- [ ] Não há fadiga auditiva

---

## 🧪 Testes
- [ ] Testes unitários atualizados
- [ ] Testes de integração áudio × UI
- [ ] Testes E2E (Playwright) quando aplicável

Descreva os testes criados ou atualizados:

---

## 📦 Dependências
- [ ] `package.json` foi alterado
- [ ] `pnpm-lock.yaml` foi regenerado
- [ ] `pnpm install` rodou localmente sem erros

⚠️ PR **não pode ser mergeado** se `package.json` mudar sem `pnpm-lock.yaml`.

---

## 🚀 Build & Deploy
- [ ] `pnpm build` passou localmente
- [ ] CI passou
- [ ] Build Vercel validado

---

## 🧠 Observações pedagógicas
Explique se este PR altera:
- fluxo de aprendizado
- dificuldade
- feedback ao usuário

---

## ✅ Checklist final
- [ ] PR pequeno e focado
- [ ] Sem warnings ignorados
- [ ] Sem logs temporários

---

## 🔧 Regra de Ouro

> **Se um export quebra build, quase sempre é bloco não fechado acima.**
> 
> **Não tente "consertar" o export — conserte o escopo.**

**Sintomas comuns:**
- `Expected ">" but found "className"` → JSX em arquivo `.ts` ou bloco não fechado
- `Expected ";" but found "."` → Função/método não fechado acima
- `Duplicate member` → Propriedade/método duplicado (copiar/colar acidental)
- `is not exported` → Verificar se o problema é no export ou no código acima

**Solução:**
1. Verificar se todos os `{`, `(`, `[` têm fechamento correspondente
2. Verificar se funções/métodos têm `}` de fechamento
3. Verificar se JSX está em arquivo `.tsx` (não `.ts`)
4. Verificar se há código duplicado acidentalmente

---
