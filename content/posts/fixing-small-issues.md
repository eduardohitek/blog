---
title: "Fixing some small Issues with my enviroment - Part 1"
date: 2021-01-17T20:00:00-03:00
draft: true
tags: ["macos", "fish", "vscode"]
categories: ["general", "fixes", "config"]
---

Sometimes you face some issues with your Enviroment and after some googling you
realize that you're not alone and probably someone has found the solution and
magicaly solved your problem.

The idea here is to document some of theses issues that I have faced and maybe
help someone who is searching this right now. For now I'll write about two
annoying issues I had recently.

1) Fish shell realy slow at autocomplete commands.

    So, if you're are using fish shell and sometimes found the autocomplete slow
    and buggy, than you probably is facing the same issue I had. But, if you
    don't know what fish shell is, here an really good article by [caarlos0](https://carlosbecker.com/posts/fish/) explaing what it is and why you should check it out.

    The Solution for this issue is to

After years relying on Community drivers like [mgo](https://github.com/go-mgo/mgo) and [globalsign/mgo](https://github.com/globalsign/mgo), last year MongoDB [announced](https://engineering.mongodb.com/post/considering-the-community-effects-of-introducing-an-official-golang-mongodb-driver) they were building it’s own solution. Last March they [released](https://www.mongodb.com/blog/post/official-mongodb-go-driver-now-ga-and-ready-for-production) the version 1.0.0, so let’s see how to make some normal operations using the Oficial driver.

First of all, you need to download the driver using go get.

    go.mongodb.org/mongo-driver/mongo

Assuming your MongoDB installation is using the default setting, your method should be like this:

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

To test the connection to the mongo, we can call a function called Ping, and check if return any error. Otherwise, out connection was successful.

    func main() {
        c := GetClient()
        err := c.Ping(context.Background(), readpref.Primary())
        if err != nil {
            log.Fatal("Couldn't connect to the database", err)
        } else {
            log.Println("Connected!")
        }
    }

Now for the next examples I created a database called `civilact` and a collection `heroes` and add the followings documents:

    {
        "_id" : ObjectId("5d0574824d9f7ff15e989171"),
        "name" : "Tony Stark",
        "alias" : "Iron Man",
        "signed" : true
    }
    {
        "_id" : ObjectId("5d0574d74d9f7ff15e989172"),
        "name" : "Steve Rodgers",
        "alias" : "Captain America",
        "signed" : false
    }
    {
        "_id" : ObjectId("5d0574e94d9f7ff15e989173"),
        "name" : "Vision",
        "alias" : "Vision",
        "signed" : true
    }
    {
        "_id" : ObjectId("5d0575344d9f7ff15e989174"),
        "name" : "Clint Barton",
        "alias" : "Hawkeye",
        "signed" : false
    }

To work with these documents, would be better if we create a struct that represents all the Fields and their json names.

    type Hero struct {
        Name   string `json:"name"`
        Alias  string `json:"alias"`
        Signed bool   `json:"signed"`
    }

Now let's create a Method that will return all Heroes expecting 2 parameters: MongoDB Client and a bson.M that represents a filter. Is this filter is empty, the method will return all documents.

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
        for cur.Next(context.TODO()) {
            var hero Hero
            err = cur.Decode(&hero)
            if err != nil {
                log.Fatal("Error on Decoding the document", err)
            }
            heroes = append(heroes, &hero)
        }
        return heroes
    }

The breakdown is:

1. Create a `collection` that represents the collection in the database;
2. Ask the `collection` to return a cursor of with the elements based oh the filter (in this case the filter is empty, so will return all elements);
3. Iterate this cursor and Decode each document to a Hero type;
4. Append the Hero decoded in the `heroes` array.

If we run inside the main function, our return will be:

    heroes := ReturnAllHeroes(c, bson.M{})
    for _, hero := range heroes {
        log.Println(hero.Name, hero.Alias, hero.Signed)
    }

    2019/06/15 21:07:00 Tony Stark Iron Man true
    2019/06/15 21:07:00 Steve Rodgers Captain America false
    2019/06/15 21:07:00 Vision Vision true
    2019/06/15 21:07:00 Clint Barton Hawkeye false

To retrieve just the Heroes whom signed the [Sokovia Accords](https://marvelcinematicuniverse.fandom.com/wiki/Sokovia_Accords), we just need to change the filter.

    heroes := ReturnAllHeroes(c, bson.M{"signed": true})

    2019/06/15 21:18:04 Tony Stark Iron Man true
    2019/06/15 21:18:04 Vision Vision true

To retrieve just one Hero, our new method will be like this:

    func ReturnOneHero(client *mongo.Client, filter bson.M) Hero {
        var hero Hero
        collection := client.Database("civilact").Collection("heroes")
        documentReturned := collection.FindOne(context.TODO(), filter)
        documentReturned.Decode(&hero)
        return hero
    }

The call will be:

        hero := ReturnOneHero(c, bson.M{"name": "Vision"})
        log.Println(hero.Name, hero.Alias, hero.Signed)

        2019/06/15 22:55:44 Vision Vision true

Now, to increase our collection of Heroes and insert, for example Doctor Strange: The new method will be like this:

    func InsertNewHero(client *mongo.Client, hero Hero) interface{} {
        collection := client.Database("civilact").Collection("heroes")
        insertResult, err := collection.InsertOne(context.TODO(), hero)
        if err != nil {
            log.Fatalln("Error on inserting new Hero", err)
        }
        return insertResult.InsertedID
    }

That's how we method will be used and checked by our previous method `ReturnOneHero`:

    hero = Hero{Name: "Stephen Strange", Alias: "Doctor Strange", Signed: true}
    insertedID := InsertNewHero(c, hero)
    log.Println(insertedID)
    hero = ReturnOneHero(c, bson.M{"alias": "Doctor Strange"})
    log.Println(hero.Name, hero.Alias, hero.Signed)

Great! We added a Sorcerer Supreme in our Heroes collection, but what if he didn't like and asked us to remove him from it? Well, that's why we need a `RemoveOneHero` method.

    func RemoveOneHero(client *mongo.Client, filter bson.M) int64 {
        collection := client.Database("civilact").Collection("heroes")
        deleteResult, err := collection.DeleteOne(context.TODO(), filter)
        if err != nil {
            log.Fatal("Error on deleting one Hero", err)
        }
        return deleteResult.DeletedCount
    }

And that's how we check:

    heroesRemoved := RemoveOneHero(c, bson.M{"alias": "Doctor Strange"})
    log.Println("Heroes removed count:", heroesRemove
    hero = ReturnOneHero(c, bson.M{"alias": "Doctor Strange"})
    log.Println("Is Hero empty?", hero == Hero{ })

For last, let's imagine that Hawkeye changed his mind and now wants to sign the Accords. So let's make de `UpdateHero` method.

    func UpdateHero(client *mongo.Client, updatedData bson.M, filter bson.M) int64 {
        collection := client.Database("civilact").Collection("heroes")
        atualizacao := bson.D{ {Key: "$set", Value: updatedData} }
        updatedResult, err := collection.UpdateOne(context.TODO(), filter, atualizacao)
        if err != nil {
            log.Fatal("Error on updating one Hero", err)
        }
        return updatedResult.ModifiedCount
    }

That's it! The regular CRUD Operation was covered and our Heroes can decide their fate.
All the code for these examples is available [here](http://github.com/eduardohitek/mongodb-go-example) and this tutorial was also posted at my [blog](http://blog.eduardohitek.com). Here is the Driver's oficial [repo](https://github.com/mongodb/mongo-go-driver) and oficial [docs](https://godoc.org/go.mongodb.org/mongo-driver/mongo)

Feel free to get in touch for any question, suggestion or mistake that i made.

