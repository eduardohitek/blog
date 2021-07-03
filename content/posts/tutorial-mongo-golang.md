---
title: "Tutorial com driver oficial para de Go para MongoDB"
date: 2021-07-03T08:42:44-03:00
draft: false
tags: ["mongodb", "golang", "tutorial"]
categories: ["general", "database", "golang", "tutorial"]
---

Após anos usando drivers feitos pela comunidade como [mgo](https://github.com/go-mgo/mgo) e [globalsign/mgo](https://github.com/globalsign/mgo), ano passado a MongoDB [anunciou](https://engineering.mongodb.com/post/considering-the-community-effects-of-introducing-an-official-golang-mongodb-driver) que estava construindo a sua própria solução. No último março foi [lançada](https://www.mongodb.com/blog/post/official-mongodb-go-driver-now-ga-and-ready-for-production) a versão 1.0.0. Então vamos ver como efetuar operações simples utilizando o driver oficial.

Para início, você precisa obter o driver usando o comando `go get`:

    go get -u go.mongodb.org/mongo-driver/mongo

Assumindo que a instalação do seu MongoDB está usando a configuração padrão, o seu código de conexão deverá ser assim:

    package main

    import (
        "context"
        "log"

        "go.mongodb.org/mongo-driver/mongo"
        "go.mongodb.org/mongo-driver/mongo/options"
        "go.mongodb.org/mongo-driver/mongo/readpref"
    )

    func GetClient() *mongo.Client {
        clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
        client, err := mongo.NewClient(clientOptions)
        if err != nil {
            log.Fatal(err)
        }
        err = client.Connect(context.Background())
        if err != nil {
            log.Fatal(err)
        }
        return client
    }

Para testar a conexão com o mongo, podemos efetuar a chamada da função `Ping` e verificar se a mesma retornou algum erro. Caso contrário a nossa conexão foi um sucesso.

    func main() {
        c := GetClient()
        err := c.Ping(context.Background(), readpref.Primary())
        if err != nil {
            log.Fatal("Couldn't connect to the database", err)
        } else {
            log.Println("Connected!")
        }
    }

Para os próximos exemplos, Eu criei um DB chamado `civilact` que contém uma coleção chamada `heroes` e adicionei os seguintes documentos:

    {
        "_id" : ObjectId("5d0574824d9f7ff15e989171"),
        "name" : "Tony Stark",
        "alias" : "Iron Man",
        "signed" : true
    },
    {
        "_id" : ObjectId("5d0574d74d9f7ff15e989172"),
        "name" : "Steve Rodgers",
        "alias" : "Captain America",
        "signed" : false
    },
    {
        "_id" : ObjectId("5d0574e94d9f7ff15e989173"),
        "name" : "Vision",
        "alias" : "Vision",
        "signed" : true
    },
    {
        "_id" : ObjectId("5d0575344d9f7ff15e989174"),
        "name" : "Clint Barton",
        "alias" : "Hawkeye",
        "signed" : false
    }

Afim de trabalhar com esses documentos, resolvi criar uma `struct` que contém todos os campos e adicionei as suas tags json.

    type Hero struct {
        Name   string `json:"name"`
        Alias  string `json:"alias"`
        Signed bool   `json:"signed"`
    }

Agora vamos criar uma função que irá retornar todos os heróis. Essa função espera 2 parâmetros: O MongoDB client e uma variável do tipo bson.M que representa um eventual filtro na nossa consulta. Se esse filtro for vazio, a função irá retornar todos os documentos da coleção.

    import (
        "context"
        "log"

        "go.mongodb.org/mongo-driver/bson"
        "go.mongodb.org/mongo-driver/mongo"
        "go.mongodb.org/mongo-driver/mongo/options"
        "go.mongodb.org/mongo-driver/mongo/readpref"
    )

	func ReturnAllHeroes(client *mongo.Client, filter bson.M) []*Hero {
		var heroes []*Hero
		collection := client.Database("civilact").Collection("heroes")
		cur, err := collection.Find(context.TODO(), filter)
		if err != nil {
			log.Fatal("Error on Finding all the documents", err)
		}
		cur.All(context.TODO(), &heroes)
		return heroes
	}

Nossa função faz o seguinte:

1. Cria um array de `Hero` para receber o retorno da pesquisa;
2. Cria uma variável do tipo `collection` que representa nossa coleção dentro do DB;
3. Solicita para a `colection` que retorne um cursor com os seus elementos baseado no filtro informado (nesse caso, como o filtro é vazio então será retornados todos os documentos);
4. Atribui os documentos para o nosso array de `Hero` o retorna;

Se executarmos dentro da nossa função main, o resultado será:

    heroes := ReturnAllHeroes(c, bson.M{})
    for _, hero := range heroes {
        log.Println(hero.Name, hero.Alias, hero.Signed)
    }

    2021/07/01 21:07:00 Tony Stark Iron Man true
    2021/07/01 21:07:00 Steve Rodgers Captain America false
    2021/07/01 21:07:00 Vision Vision true
    2021/07/01 21:07:00 Clint Barton Hawkeye false

Para recuperar apenas os heróis que assinaram o [Acordo de Sokovia](https://marvelcinematicuniverse.fandom.com/wiki/Sokovia_Accords), basta alterar o filtro.

    heroes := ReturnAllHeroes(c, bson.M{"signed": true})

    2021/07/01 21:18:04 Tony Stark Iron Man true
    2021/07/01 21:18:04 Vision Vision true

Para retornar apenas um Herói, nossa função deverá ser escrita assim:

    func ReturnOneHero(client *mongo.Client, filter bson.M) Hero {
        var hero Hero
        collection := client.Database("civilact").Collection("heroes")
        documentReturned := collection.FindOne(context.TODO(), filter)
        documentReturned.Decode(&hero)
        return hero
    }

E a sua chamada será:

        hero := ReturnOneHero(c, bson.M{"name": "Vision"})
        log.Println(hero.Name, hero.Alias, hero.Signed)

        2021/07/01 22:55:44 Vision Vision true

Agora, se quisermos aumentar nossa coleção de heróis e inserir por exemplo o Doutor Estranho, a nossa função de inserção será assim:

    func InsertNewHero(client *mongo.Client, hero Hero) interface{} {
        collection := client.Database("civilact").Collection("heroes")
        insertResult, err := collection.InsertOne(context.TODO(), hero)
        if err != nil {
            log.Fatalln("Error on inserting new Hero", err)
        }
        return insertResult.InsertedID
    }

Podemos inseri-lo e checar se deu tudo certo usando a nossa função de `ReturnOneHero`:

    hero = Hero{Name: "Stephen Strange", Alias: "Doctor Strange", Signed: true}
    insertedID := InsertNewHero(c, hero)
    log.Println(insertedID)
    hero = ReturnOneHero(c, bson.M{"alias": "Doctor Strange"})
    log.Println(hero.Name, hero.Alias, hero.Signed)

Ótimo! Acabamos de adicionar o Mago Supremo na nossa coleção de Heróis, porém e se ele não gostar disso e quiser ser removido? Bom, nesse caso precisamos de uma função `RemoveOneHero`.

    func RemoveOneHero(client *mongo.Client, filter bson.M) int64 {
        collection := client.Database("civilact").Collection("heroes")
        deleteResult, err := collection.DeleteOne(context.TODO(), filter)
        if err != nil {
            log.Fatal("Error on deleting one Hero", err)
        }
        return deleteResult.DeletedCount
    }

E assim podemos testar:

    heroesRemoved := RemoveOneHero(c, bson.M{"alias": "Doctor Strange"})
    log.Println("Heroes removed count:", heroesRemove
    hero = ReturnOneHero(c, bson.M{"alias": "Doctor Strange"})
    log.Println("Is Hero empty?", hero == Hero{ })

Por último, imagine que o Gavião Arqueiro mudou de ideia e agora quer assinar o Acordo? Vamos agora escrever uma função de `UpdateHero`.

    func UpdateHero(client *mongo.Client, updatedData bson.M, filter bson.M) int64 {
        collection := client.Database("civilact").Collection("heroes")
        updateField := bson.D{ {Key: "$set", Value: updatedData} }
        updatedResult, err := collection.UpdateOne(context.TODO(), filter, updateField)
        if err != nil {
            log.Fatal("Error on updating one Hero", err)
        }
        return updatedResult.ModifiedCount
    }

Então é isso! As operações CRUD foram escritas e agora os Heróis da Marvel podem decidir o seu próprio destino.

Todo o código desses exemplos está disponível [aqui](http://github.com/eduardohitek/mongodb-go-example).
Repositório do driver oficial [repo](https://github.com/mongodb/mongo-go-driver)
Documentação oficial [docs](https://godoc.org/go.mongodb.org/mongo-driver/mongo)

Qualquer dúvida ou sugestão, me pinga lá no [twitter](https://twitter.com/eduardohitek).


