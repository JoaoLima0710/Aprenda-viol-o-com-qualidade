# Checklist obrigatório para PRs que afetam áudio

- [ ] Nenhum AudioContext criado automaticamente (apenas via gesto do usuário)
- [ ] AudioEngine singleton usado em todos os serviços/componentes
- [ ] Nenhum serviço cria seu próprio AudioContext
- [ ] Testes de regressão de áudio passam (arquivos em `client/src/audio/__tests__`)
- [ ] Documentação de arquitetura de áudio revisada
- [ ] Cleanup seguro garantido em todos os componentes/serviços
- [ ] Logs de inicialização e erros revisados
