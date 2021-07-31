---
title: "Efefuando testes de benchmark Em Go"
date: 2021-07-31T11:24:06-03:00
draft: false
cover: "/images/go-benchmark/1.jpg"
coverAlt: "Efetuando testes de benchmarking em Go"
coverCaption: "Como saber se aquela função ou lib é mais performática ou não?"
tags: []
categories: []
---

Teste de Benchmark em programação é o ato de comparar de forma eficiente a performance entre algoritmos, de forma a escolher qual abordagem a seguir em determinados cenários. Podemos aplicar também na hora de decidir quais bibliotecas externas ou frameworks e a se usar, além de avaliarmos se alguma refatoração vai trazer maléfico para nosso código.

A linguagem Go já tem por padrão ferramentas para esses tipos de testes, tornando a experiência mais amigável e sem a necessidade de ferramentas externas.

Vamos ver como verificar isso na prática.

### Analisando performance de verificação de Palíndromos

Palíndromo é uma palavra ou grupo de palavras que possuem simetria linear, ou seja, permanecem iguais quando lidas de trás para frente. Um exemplo mais comum é a palavra `ovo` ou `anna` em que a ordem de leitura não altera o significado da palavra. Podemos obter esse efeito também com a combinação de algumas palavras, formando frases simples como: `Amor a Roma`.

É bem comum em entrevistas de emprego você se deparar com o desafio de escrever um algoritmo para verificar se uma frase ou palavra é palíndroma ou não.

Para exemplos eu utilizei 3 algoritmos distintos para analisarmos qual terá a melhor performance:

1) **PalindromeReverse**: recebe uma string, a inverte e verifica se as 2 strings são iguais.
```
func reverse(s string) string {
   runes := []rune(s)
   for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
       runes[i], runes[j] = runes[j], runes[i]
   }
   return string(runes)
}

func palindromeReverse(str string) bool {
   strReversed := reverse(str)
   return strReversed == str
}
```
2) **PalindromeFromEnd**: percorre a string comparando a 1a palavra com a última e assim sucessivamente.
```
func palindromeFromEnd(str string) bool {
   runes := []rune(str)
   length := len(runes)
   for i := 0; i < length; i++ {
       if runes[i] != runes[length-1-i] {
           return false
       }
   }
   return true
}
```
1) **palindromeFromMiddle**: percorre apartir dos caracteres do meio até o início/fim da string.
```
func palindromeFromMiddle(str string) bool {
   runes := []rune(str)
   length := len(runes)
   middleI, middleJ := (length/2)-1, (length/2)+1
   if length%2 == 0 {
       middleJ -= 1
   }

   for i, j := middleI, middleJ; i >= 0; i, j = i-1, j+1 {
       if runes[i] != runes[j] {
           return false
       }
   }
   return true
}
```

Com as funções criadas, agora precisamos escrever as funções de Testes de Benchmark.

### Testes de Benchmark

No nosso exemplo, vamos criar o arquivo de teste `main_test.go` e dentro dele criar as seguintes funções de teste:
```
func BenchmarkPalindromeFromMiddle_Banana(b *testing.B) {
   for n := 0; n < b.N; n++ {
       palindromeFromMiddle("banana")
   }
}
func BenchmarkPalindromeReverse_Banana(b *testing.B) {
   for n := 0; n < b.N; n++ {
       palindromeReverse("banana")
   }
}
func BenchmarkPalindromeFromEnd_Banana(b *testing.B) {
   for n := 0; n < b.N; n++ {
       palindromeFromEnd("banana")
   }
}
```

Aqui estamos pedindo para Go rodar cada uma das funções com a string `banana`. Próximo passo é executar o seguinte comando no terminal: `go test -bench=. -benchtime=1s`
```
~/dev/eduardohitek/go-benchmark-example main*
❯ go test -bench=. -benchtime=1s
goos: darwin
goarch: amd64
pkg: github.com/eduardohitek/go-benchmark-example
cpu: Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz
BenchmarkPalindromeFromMiddle_Banana-12         69054604                16.36 ns/op
BenchmarkPalindromeReverse_Banana-12            16145308                69.83 ns/op
BenchmarkPalindromeFromEnd_Banana-12            91725068                15.84 ns/op
PASS
ok      github.com/eduardohitek/go-benchmark-example    4.563s
```

Seguindo o argumento que informamos, cada função de benchmark é executada por 1 segundo e temos 2 informações para cada: Quantidade de execuções e tempo médio de cada execução. Para esse exemplo de palavra não palíndroma, e quando a diferença estava entre a 1a e última letra o **BenchmarkPalindromeFromEnd_Banana** foi mais performático pois teve a médio de tempo por operação menor.

O no próximo exemplo usamos uma palavra palíndroma maior (*nomelgibsonisacasinosbiglemon*):
```
~/dev/eduardohitek/go-benchmark-example main*
❯ go test -bench=. -benchtime=1s
goos: darwin
goarch: amd64
pkg: github.com/eduardohitek/go-benchmark-example
cpu: Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz
BenchmarkPalindromeFromMiddle_nomelgibsonisacasinosbiglemon-12          18193920                56.29 ns/op
BenchmarkPalindromeReverse_nomelgibsonisacasinosbiglemon-12              4255890               272.6 ns/op
BenchmarkPalindromeFromEnd_nomelgibsonisacasinosbiglemon-12             16961797                63.68 ns/op
PASS
ok      github.com/eduardohitek/go-benchmark-example    5.078s

```


Nesse exemplo o **BenchmarkPalindromeFromMiddle** saiu na frente. O último teste utiliza uma string bem maior (+800 caracteres) e confirmamos qual função se sai melhor nesse cenário:

```
~/dev/eduardohitek/go-benchmark-example main*
❯ go test -bench=. -benchtime=1s
goos: darwin
goarch: amd64
pkg: github.com/eduardohitek/go-benchmark-example
cpu: Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz
BenchmarkPalindromeFromMiddle_longstring-12       672807              1774 ns/op
BenchmarkPalindromeReverse_longstring-12          141945              7784 ns/op
BenchmarkPalindromeFromEnd_longstring-12          524437              2121 ns/op
PASS
ok      github.com/eduardohitek/go-benchmark-example    5.006s
```

Então pudemos ver como é fácil efetuarmos esse tipo de testes para avaliar se alterações e performance do algoritmos em aplicações em Go.

Todo o código fonte dos exemplos se encontra [aqui](https://github.com/eduardohitek/go-benchmark-example).
