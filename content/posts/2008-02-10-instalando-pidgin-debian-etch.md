---
title: "Instalando Pidgin Debian Etch"
date: 2008-02-10T03:25:03-03:00
draft: false
cover: "/images/2008-02-10-instalando-pidgin-debian-etch/1.png"
coverAlt: "Tela de about do Pidgin 2.3.1"
coverCaption: "Tela de about do Pidgin 2.3.1"
tags: ["tutorial", "linux", "debian"]
categories: ["tutorial", "linux", "debian"]
---

[Pidgin][link6] (conhecido anteriormente como Gaim) é um [mensageiro instantâneo][link1] multi-plataforma, um programa [client side][link2] que suporta vários protocolos. É um [programa livre][link3] disponível sob a licença [GNU General Public License][link4].

Hoje em dia ele é uma das melhores alternativas de mensageiro instantâneo para Linux. Infelizmente não é disponibilizado um pacote compilado para instalação no Debian Etch, por isso devemos baixar o Código Fonte apartir do site e compila-lo para sua versão do debian.

Primeiro passo é instalar as dependências para a compilação do Pidgin.
Digite como sudo no terminal:

```
aptitude install libxml-parser-perl libgtk2.0-dev libxml2-dev libgnutls-dev

apt-get -y install intltool libstartup-notification0-dev libgtkspell-dev xorg-dev libxml2-dev libgstreamer0.10-dev libmeanwhile-dev network-manager-dev libperl-dev libgnutls-dev tcl8.3-dev tk-dev
```


Depois entre no site oficial: [www.pidgin.im/download][link5] e baixe o pacote source.
Após isso descompacte o arquivo com o código fonte:

`tar -jxf pidgin-2.3.1.tar.bz2`

depois entre na pasta:

`cd pidgin-2.3.1`

e execute os seguintes comandos, o último como sudo:

```
./configure

make

make install
```

Após isso é só procurar o Pidgin no seu menu de Aplicações - Internet - Mensageiro de Internet Pidgin.

Até o Proximo Tutorial.

[link1]:http://pt.wikipedia.org/wiki/Mensageiro_instant%C3%A2neo
[link2]:http://pt.wikipedia.org/wiki/Client_side
[link3]:http://pt.wikipedia.org/wiki/Programa_livre
[link4]:http://pt.wikipedia.org/wiki/GNU_General_Public_License
[link5]:www.pidgin.im/download
[link6]:www.pidgin.im
