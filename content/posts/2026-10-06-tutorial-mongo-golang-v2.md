---
title: "Tutorial do driver oficial de Go para MongoDB - Versão 2026 (driver v2)"
date: 2026-10-06T21:00:00-03:00
draft: true
description: "Tutorial atualizado de MongoDB com Go usando a versão 2 do driver oficial: como conectar, consultar, inserir, atualizar e remover documentos, e o que mudou em relação à v1."
cover: "/images/mongodb_golang/1.jpeg"
images: ["/images/mongodb_golang/1.jpeg"]
coverAlt: "Logo do Golang + MongoDB"
coverCaption: "Logo do Golang + MongoDB"
translationURL: "/posts-en/2026-10-06-mongodb-golang-tutorial-v2/"
tags: ["mongodb", "golang", "tutorial"]
categories: ["general", "database", "golang", "tutorial"]
---

Em 2021 eu escrevi um [tutorial do driver oficial de Go para MongoDB](/posts/2021-07-03-tutorial-mongo-golang/). Desde então muita coisa mudou: em dezembro de 2024 a MongoDB lançou a versão 2.0 do driver, com um novo caminho de import e algumas mudanças que quebram a compatibilidade com o código antigo. A linha 1.x foi [oficialmente marcada como deprecated](https://www.mongodb.com/docs/drivers/go/v1.x/whats-new/) e só recebe correções de bugs e de segurança; novidades só chegam na v2.

Então resolvi refazer o tutorial usando o mesmo exemplo de antes (os heróis da Marvel e o Acordo de Sokovia), só que com a versão atual do driver (v2.9.2 no momento em que escrevo).

## Instalação

Com o seu módulo Go criado (`go mod init`), baixe o driver. Repare no `/v2` no caminho:

```bash
go get go.mongodb.org/mongo-driver/v2/mongo
```

## Conectando

Assumindo que o seu MongoDB está rodando com a configuração padrão (se quiser subir um rápido: `docker run -d -p 27017:27017 mongo:8`), o código de conexão fica assim:

```go
package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func GetClient() (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
	return mongo.Connect(clientOptions)
}
```

A diferença mais visível em relação à v1: não existe mais `mongo.NewClient` seguido de `client.Connect(ctx)`. Agora é só uma chamada para `mongo.Connect`, que **não recebe mais um `context`**.

Para testar a conexão, chamamos o `Ping`. Aproveito também para garantir que o client seja desconectado no final com `Disconnect`, e para usar um `context` com timeout, assim nenhuma operação fica pendurada para sempre:

```go
func main() {
	client, err := GetClient()
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			log.Fatal(err)
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatal("Couldn't connect to the database: ", err)
	}
	log.Println("Connected!")
}
```

## Os dados

Assim como no post anterior, temos um DB chamado `civilact` com uma coleção `heroes` contendo os seguintes documentos:

```json
{ "name": "Tony Stark",   "alias": "Iron Man",        "signed": true  },
{ "name": "Steve Rogers", "alias": "Captain America", "signed": false },
{ "name": "Vision",       "alias": "Vision",          "signed": true  },
{ "name": "Clint Barton", "alias": "Hawkeye",         "signed": false }
```

E a `struct` que representa um herói. Dessa vez usando as tags `bson` (que são as que o driver realmente lê) e incluindo o `_id`:

```go
type Hero struct {
	ID     bson.ObjectID `bson:"_id,omitempty"`
	Name   string        `bson:"name"`
	Alias  string        `bson:"alias"`
	Signed bool          `bson:"signed"`
}
```

Repare que o tipo é `bson.ObjectID`. Na v1 ele ficava em `primitive.ObjectID`, mas o pacote `bson/primitive` foi incorporado ao pacote `bson` na v2. O `omitempty` faz com que, ao inserir um herói sem ID, o próprio MongoDB gere um.

Para não repetir o nome do DB e da coleção em toda função, criei um pequeno helper:

```go
func heroesCollection(client *mongo.Client) *mongo.Collection {
	return client.Database("civilact").Collection("heroes")
}
```

## Buscando vários documentos

A função que retorna os heróis recebe um `context`, o client e um filtro `bson.M`. Se o filtro for vazio, todos os documentos da coleção são retornados:

```go
func ReturnAllHeroes(ctx context.Context, client *mongo.Client, filter bson.M) ([]Hero, error) {
	cur, err := heroesCollection(client).Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	var heroes []Hero
	if err := cur.All(ctx, &heroes); err != nil {
		return nil, err
	}
	return heroes, nil
}
```

Diferente do post de 2021, as funções agora devolvem o erro em vez de chamar `log.Fatal` lá dentro. Assim quem chama decide o que fazer, e o erro do `cur.All` (que antes era ignorado) também é tratado.

Chamando no `main`:

```go
heroes, err := ReturnAllHeroes(ctx, client, bson.M{})
if err != nil {
	log.Fatal(err)
}
for _, hero := range heroes {
	log.Println(hero.Name, hero.Alias, hero.Signed)
}
```

```text
2026/10/06 23:35:44 Tony Stark Iron Man true
2026/10/06 23:35:44 Steve Rogers Captain America false
2026/10/06 23:35:44 Vision Vision true
2026/10/06 23:35:44 Clint Barton Hawkeye false
```

Para trazer apenas os heróis que assinaram o [Acordo de Sokovia](https://marvelcinematicuniverse.fandom.com/wiki/Sokovia_Accords), basta mudar o filtro:

```go
heroes, err = ReturnAllHeroes(ctx, client, bson.M{"signed": true})
```

```text
2026/10/06 23:35:44 Tony Stark Iron Man true
2026/10/06 23:35:44 Vision Vision true
```

## Buscando um documento

Para retornar um único herói usamos o `FindOne`. Aqui vale um cuidado que o post antigo não tinha: quando nenhum documento bate com o filtro, o `Decode` retorna o erro `mongo.ErrNoDocuments`. Eu trato esse caso devolvendo `nil`, para diferenciar "não encontrei" de "deu erro":

```go
func ReturnOneHero(ctx context.Context, client *mongo.Client, filter bson.M) (*Hero, error) {
	var hero Hero
	err := heroesCollection(client).FindOne(ctx, filter).Decode(&hero)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &hero, nil
}
```

(Não esqueça de adicionar `"errors"` nos imports.)

```go
hero, err := ReturnOneHero(ctx, client, bson.M{"name": "Vision"})
if err != nil {
	log.Fatal(err)
}
log.Println(hero.Name, hero.Alias, hero.Signed)
```

```text
2026/10/06 23:35:44 Vision Vision true
```

## Inserindo

Para aumentar o nosso time e adicionar o Doutor Estranho:

```go
func InsertNewHero(ctx context.Context, client *mongo.Client, hero Hero) (bson.ObjectID, error) {
	result, err := heroesCollection(client).InsertOne(ctx, hero)
	if err != nil {
		return bson.ObjectID{}, err
	}
	return result.InsertedID.(bson.ObjectID), nil
}
```

O `InsertedID` continua sendo do tipo `any`, então faço a conversão para `bson.ObjectID`, já que é o MongoDB quem está gerando o ID.

```go
insertedID, err := InsertNewHero(ctx, client, Hero{Name: "Stephen Strange", Alias: "Doctor Strange", Signed: true})
if err != nil {
	log.Fatal(err)
}
log.Println("Inserted ID:", insertedID.Hex())
hero, err = ReturnOneHero(ctx, client, bson.M{"alias": "Doctor Strange"})
if err != nil {
	log.Fatal(err)
}
log.Println(hero.Name, hero.Alias, hero.Signed)
```

```text
2026/10/06 23:35:44 Inserted ID: 6ac5b0001fd5d3b23af5fabb
2026/10/06 23:35:44 Stephen Strange Doctor Strange true
```

## Removendo

E se o Mago Supremo não gostar da ideia e quiser sair? Precisamos de uma função `RemoveOneHero`:

```go
func RemoveOneHero(ctx context.Context, client *mongo.Client, filter bson.M) (int64, error) {
	result, err := heroesCollection(client).DeleteOne(ctx, filter)
	if err != nil {
		return 0, err
	}
	return result.DeletedCount, nil
}
```

```go
removed, err := RemoveOneHero(ctx, client, bson.M{"alias": "Doctor Strange"})
if err != nil {
	log.Fatal(err)
}
log.Println("Heroes removed count:", removed)
hero, err = ReturnOneHero(ctx, client, bson.M{"alias": "Doctor Strange"})
if err != nil {
	log.Fatal(err)
}
log.Println("Is Hero nil?", hero == nil)
```

```text
2026/10/06 23:35:44 Heroes removed count: 1
2026/10/06 23:35:44 Is Hero nil? true
```

## Atualizando

Por último, o Gavião Arqueiro mudou de ideia e agora quer assinar o Acordo:

```go
func UpdateHero(ctx context.Context, client *mongo.Client, updatedData bson.M, filter bson.M) (int64, error) {
	update := bson.D{{Key: "$set", Value: updatedData}}
	result, err := heroesCollection(client).UpdateOne(ctx, filter, update)
	if err != nil {
		return 0, err
	}
	return result.ModifiedCount, nil
}
```

```go
modified, err := UpdateHero(ctx, client, bson.M{"signed": true}, bson.M{"alias": "Hawkeye"})
if err != nil {
	log.Fatal(err)
}
log.Println("Heroes updated count:", modified)
hero, err = ReturnOneHero(ctx, client, bson.M{"alias": "Hawkeye"})
if err != nil {
	log.Fatal(err)
}
log.Println(hero.Name, hero.Alias, hero.Signed)
```

```text
2026/10/06 23:35:44 Heroes updated count: 1
2026/10/06 23:35:44 Clint Barton Hawkeye true
```

## O que mudou da v1 para a v2

Resumindo as mudanças que apareceram neste tutorial (a lista completa está no [guia de migração oficial](https://github.com/mongodb/mongo-go-driver/blob/master/docs/migration-2.0.md)):

- **Caminho do import:** `go.mongodb.org/mongo-driver/...` virou `go.mongodb.org/mongo-driver/v2/...`.
- **Conexão:** `mongo.NewClient` foi removido. Use `mongo.Connect(opts)`, que também deixou de receber um `context`.
- **Pacote `primitive`:** foi incorporado ao `bson`. `primitive.ObjectID` virou `bson.ObjectID`, `primitive.M` virou `bson.M` e assim por diante.
- **Options:** os builders (`options.Find()`, `options.Client()`...) continuam com a mesma cara no uso comum (`options.Find().SetLimit(10)`), mas por baixo agora são listas de setters. Isso só importa se você manipulava as structs de options diretamente.
- **`InsertMany`:** passou a aceitar qualquer slice (`any`) em vez de `[]interface{}`, então dá para passar um `[]Hero` direto.
- **`Distinct`:** agora retorna um resultado com `Decode`, igual ao `FindOne`, em vez de um `[]interface{}`.
- **`SingleResult.DecodeBytes`:** foi renomeado para `Raw`.

Fora do driver, também aproveitei para modernizar o código: tags `bson` na struct, `context` com timeout, `Disconnect` no final, tratamento de `mongo.ErrNoDocuments` e funções retornando `error`.

## Links

- Código dos exemplos: [eduardohitek/mongodb-go-example](https://github.com/eduardohitek/mongodb-go-example)
- Repositório do driver oficial: [mongodb/mongo-go-driver](https://github.com/mongodb/mongo-go-driver)
- Documentação: [pkg.go.dev/go.mongodb.org/mongo-driver/v2/mongo](https://pkg.go.dev/go.mongodb.org/mongo-driver/v2/mongo)
- Guia de migração v1 → v2: [migration-2.0.md](https://github.com/mongodb/mongo-go-driver/blob/master/docs/migration-2.0.md)

Qualquer dúvida ou sugestão, me chama lá no [LinkedIn](https://www.linkedin.com/in/eduardohitek/).
