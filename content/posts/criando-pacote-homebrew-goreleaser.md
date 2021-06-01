---
title: "Criando e disponibilizando uma aplicação no Homebrew, usando o GoReleaser"
date: 2021-06-01T08:00:00-03:00
draft: false
---

O [homebrew](https://brew.sh/index_pt-br) é um dos principais Gerenciadores de pacotes para macOS, que através da linha de comando te permite instalar centenas de aplicativos de forma fácil e prática. Além disso possui ferramentas para sempre atualizá-lo quando necessário. Por ser um projeto Open Source, ele te possibilita a criar sua própria [Formula](https://docs.brew.sh/Formula-Cookbook) e assim disponibilizar suas aplicações e utilitários. Vou mostrar a seguir como fazer utilizando o [GoReleaser](https://github.com/goreleaser/goreleaser).

No meu dia a dia, volta e meia eu preciso gerar uma chave [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier) válida e normalmente recorria para algum site que a gerasse para mim, como por exemplo esse [aqui](https://www.uuidgenerator.net/). O problema é que querendo ou não isso acabava quebrando o meu fluxo, pois precisava ir ao browser acessar o site, clicar para copiar o valor e só assim poder utilizá-lo. Eu queria algo mais simples, apenas um comando que eu poderia executar via terminal e boom! Já teria o valor disponível na minha área de transferência. Sendo assim, ao invés de usar alguma outra solução disponível, pensei em escrever minha própria solução.

A aplicação nada mais é do que um executável em Go que gera o UUID e o imprime sem quebrar a linha:
```
package main

import (
   "fmt"

   "github.com/google/uuid"
)

func main() {
   fmt.Print(uuid.New().String())
}
```
Estando isso disponível em um repositório público do [Github](https://github.com/eduardohitek/uuidg), o próximo passo é disponibilizá-lo via homebrew. E é aqui que o GoReleaser entra em cena.

[GoReleaser](https://github.com/goreleaser/goreleaser) é um utilitário criado pelo [caarlos0](https://twitter.com/caarlos0) para auxiliar na distribuição de aplicações escritas em Go. Dentre suas diversas funcionalidades, ele consegue versionar sua aplicação, gerar executáveis para vários Sistemas Operacionais e disponibilizá-los localmente ou em algum repositório remoto. Além disso, você pode configurar a criação de uma Formula de homebrew e assim poder instalá-lo em apenas uma linha de comando. A sua [instalação](https://goreleaser.com/install/) e [configuração](https://goreleaser.com/quick-start/) são fáceis e estão disponíveis no [site oficial](https://goreleaser.com/).

Com tudo configurado, o último passo foi configurar o arquivo .goreleaser.yaml para gerar a minha Formula homebrew dentro de um repositório do meu github e então executar `goreleaser release --rm-dist`
```
brews:
 - tap:
     owner: eduardohitek
     name: homebrew-tap
   folder: Formula
   homepage: https://github.com/eduardohitek/uuidg
   description: Generates an UUID.
nfpms:
 - homepage: https://github.com/eduardohitek/uuidg
   description: Generates an UUID.
   maintainer: Eduardo Hitek <eduardohitek@gmail.com.com>
   license: MIT
   vendor: HTK Solutions
   formats:
     - apk
     - deb
     - rpm
```
Para efetuar a instalação, basta chamar passar o nome do seu repositório como parâmetro para o homebrew:

`brew install eduardohitek/tap/uuidg`

O último passo foi criar uma abreviação do fish terminal para chamar o executável e colocar o seu conteúdo na área de transferência.

`abbr -a uuid 'uuidg | pbcopy'`

