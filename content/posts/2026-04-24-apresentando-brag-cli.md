---
title: "Apresentando o brag-cli: nunca mais esqueça suas conquistas profissionais"
date: 2026-04-24T10:00:00-03:00
draft: false
cover: "images/2026-04-24-apresentando-brag-cli/1.png"
coverAlt: "Terminal mostrando o brag-cli em uso"
coverCaption: "brag-cli - Track every win. Own your career."
tags: ["cli", "carreira", "go", "golang", "produtividade", "ia"]
categories: ["golang", "carreira", "produtividade"]
---

Chegou a época de performance review. Seu gestor pede um resumo do que você entregou nos últimos seis meses. Você abre um documento em branco e... trava. Você sabe que fez muita coisa importante, mas os detalhes sumiram na correria do dia a dia.

Esse problema é mais comum do que parece, e tem até nome: **brag document** — um conceito popularizado pela [Julia Evans](https://jvns.ca/blog/brag-documents/) e pelo [Elton Minetto](https://eltonminetto.dev/post/2022-04-14-brag-document/) que consiste em manter um registro contínuo das suas conquistas profissionais. O problema é que manter esse documento atualizado manualmente é chato, e a gente acaba esquecendo.

Foi pensando nisso que criei o **[brag-cli](https://github.com/eduardohitek/brag-cli)**: uma ferramenta de linha de comando open-source que automatiza esse processo do início ao fim.

## O que é o brag-cli?

O brag-cli é uma CLI escrita em Go que centraliza suas conquistas profissionais, sincroniza automaticamente com as ferramentas que você já usa (GitHub, Jira, Linear) e gera narrativas de performance review usando IA. O lema é simples: **"Track every win. Own your career."**

A ideia é que você nunca mais precise garimpar pull requests antigos ou históricos de tickets na hora de escrever sua auto-avaliação. O brag-cli faz isso por você.

## Instalação

Existem três formas de instalar:

**Via Homebrew (recomendado):**
```bash
brew install eduardohitek/tap/brag
```

**Via Go:**
```bash
go install github.com/eduardohitek/brag@latest
```

**Download manual:** baixe o binário diretamente na [página de releases](https://github.com/eduardohitek/brag-cli/releases/latest) do GitHub.

## Fluxo básico

O uso do brag-cli segue três etapas principais:

**1. Configuração inicial:**
```bash
brag init
```
O comando inicia um assistente interativo para conectar suas integrações (GitHub, Jira, Linear) e configurar as chaves de API da IA (Anthropic ou OpenAI).

**2. Capturar e enriquecer conquistas:**
```bash
brag sync && brag enrich
```
O `brag sync` puxa automaticamente seus pull requests merged e tickets concluídos. O `brag enrich` aplica IA sobre as entradas brutas, convertendo-as para o formato **STAR** (Situation, Task, Action, Result) e atribuindo tags de impacto.

**3. Gerar e exportar o relatório:**
```bash
brag report && brag export
```
Gera uma narrativa de performance review sintetizada por IA e exporta em PDF ou Markdown — sem lock-in de nenhuma plataforma.

## Principais funcionalidades

**Registro manual de conquistas:**
Além da sincronização automática, você pode registrar conquistas manualmente a qualquer momento:
```bash
brag add "Refatorei o serviço de pagamentos, reduzindo a latência p99 em 40%"
```

**Enriquecimento com IA:**
O `brag enrich` transforma anotações brutas em narrativas estruturadas no formato STAR, aplica tags de impacto automaticamente (`reliability`, `velocity`, `leadership`, `mentoring`, `delivery`, `quality`) e atribui uma pontuação de impacto de 1 a 5.

**Sincronização com integrações:**
O `brag sync` conecta com GitHub, Jira e Linear e puxa automaticamente o trabalho que você já fez, com deduplicação automática para evitar entradas repetidas.

**OKR Tracking:**
Use `brag okr` para ligar suas conquistas aos Objetivos e Resultados-Chave da sua empresa. A IA consegue inferir associações com alta precisão.

**StarTrail:**
O comando `brag startrail` permite configurar o contexto da sua trilha de carreira, alinhando o enriquecimento das entradas com os requisitos do próximo nível ou promoção.

**Armazenamento local e privado:**
Todos os dados ficam armazenados localmente em `~/.brag/cache/`, com sincronização opcional via um repositório privado no GitHub. Nenhum banco de dados externo necessário.

## Conclusão

O brag-cli nasceu da minha própria frustração com performance reviews e com a dificuldade de lembrar tudo que entreguei. Se você também sofre com isso, vale a pena experimentar.

A documentação completa está em **[eduardohitek.github.io/brag-cli](https://eduardohitek.github.io/brag-cli/)** e o código-fonte no **[GitHub](https://github.com/eduardohitek/brag-cli)**. Feedbacks, issues e PRs são muito bem-vindos!
