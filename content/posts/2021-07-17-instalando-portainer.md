---
title: "Instalação do Portainer"
date: 2021-07-17T07:37:06-03:00
draft: false
cover: "/images/portainer/3.png"
coverAlt: "Tela inicial do Portainer com os containers existentes"
coverCaption: "Tela inicial do Portainer com os containers existentes"
tags: ["docker", "portainer", "tutorial"]
categories: ["general", "docker", "tutorial"]
---

[Portainer](https://www.portainer.io/products/community-edition) é uma aplicação Open Source para gerenciamento do Docker em máquinas locais ou servidores.
Através de sua interface gráfica é possível visualizar e editar seus Containers, Imagens, Volumes e etc. E sua instalação é muito fácil pois o mesmo é distribuído como uma imagem Docker.

Basta executar os seguintes passos:

1) Criar um `volume` para persistir as suas configurações:
```sh
docker volume create portainer_data
```
2) Rodar o comando para o docker criar o container e passar alguns parâmetros de configurações iniciais:
```sh
docker run -d -p 9000:9000 --name=portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce
```
Com esse comando estamos dizendo para o Docker rodar esse container em background, exportar a porta 9000, setar o nome para `portainer`, configurar a política de reinício para sempre reiniciar e linkar os volumes do container para volumes locais da sua máquina.

Após a execução do comando, basta acessar http://localhost:9000 e configurar a senha de admin.

![Configurar senha de acesso ao Portainer](/images/portainer/1.png)

O próximo passo é indicar qual ambiente você quer gerenciar, no meu caso vou selecionar a instância local do docker.

![Selecionar ambiente para gerenciamento](/images/portainer/2.png)

E pronto, você terá disponível as listas dos container ativos, seus status e possíveis ações disponíveis.

![Lista de containers](/images/portainer/3.png)
