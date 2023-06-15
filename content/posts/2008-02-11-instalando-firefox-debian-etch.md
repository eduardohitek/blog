---
title: "Instalando o Firefox no Debian Etch"
date: 2008-02-11T03:19:42-03:00
draft: false
cover: "/images/2008-02-11-instalando-firefox-debian-etch/1.png"
coverAlt: "Tela de about do Firefox 2.0.0.11"
coverCaption: "Tela de about do Firefox 2.0.0.11"
tags: ["tutorial", "linux", "debian"]
categories: ["tutorial", "linux", "debian"]
---

Uma das grande queixas dos usuários do Debian, é o uso do Iceweasel no lugar do nosso querido a amado Firefox.
Mas isso pode ser resolvido através desse tutorial.

Primeiro passo é instalar a libstdc++5 pois o Firefox precisa dela, para isso como sudo execute no terminal:

`aptitude install libstdc++5`

Após isso baixe do site do Firefox a versão mais nova do navegador para Linux, que no caso é a versão 2.0.0.12
Após isso como sudo, copie para a pasta /opt e descompacte la mesmo.

```
cp firefox-2.0.0.12.tar.gz /opt
tar -xvf firefox-2.0.0.12.tar.gz
```

Agora você vai ter que desinstalar o Iceweasel executando como sudo:

`aptitude remove iceweasel`

Agora basta apontar o atalho do firefox para o firefox que você extraiu na pasta /opt e substituiu o atalho para os pluggins do antigo iceweasel:
(Todos os comandos como sudo)

```
ln -s /opt/firefox/firefox /usr/bin/firefox
rm -rf /opt/firefox/plugins/ && ln -s /usr/lib/mozilla/plugins/ /opt/firefox/plugins
```

Após isso basta criar um atalho no seu painel para o comando "firefox" e procurar o icone do firefox em /opt/firefox/icons.

Até o proximo tutorial.
