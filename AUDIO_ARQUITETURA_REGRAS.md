# Regras arquiteturais de áudio

## Proibido
- Criar AudioContext automaticamente (em mount, useEffect, construtor, etc)
- Instanciar mais de um AudioContext por app
- Inicializar áudio sem gesto explícito do usuário
- Serviços/componentes criarem seu próprio AudioContext

## Obrigatório
- Usar AudioEngine singleton para todo acesso ao contexto de áudio
- Inicializar áudio apenas via AudioBootstrap após gesto do usuário
- Garantir cleanup seguro no unmount/dispose
- Testes de regressão cobrindo todos cenários críticos
- Documentar qualquer alteração na arquitetura de áudio
