---
title: "MongoDB Go Driver Tutorial - 2026 Edition (driver v2)"
date: 2026-10-06T21:00:00-03:00
draft: true
description: "An updated MongoDB with Go tutorial using version 2 of the official driver: how to connect, query, insert, update and delete documents, and what changed from v1."
cover: "/images/mongodb_golang/1.jpeg"
images: ["/images/mongodb_golang/1.jpeg"]
coverAlt: "Golang + MongoDB logos"
coverCaption: "Golang + MongoDB logos"
translationURL: "/posts/2026-10-06-tutorial-mongo-golang-v2/"
tags: ["mongodb", "golang", "tutorial"]
categories: ["general", "database", "golang", "tutorial"]
---

A while ago I wrote a [MongoDB Go driver tutorial](/posts-en/ya-mongodb-tutorial/). A lot has changed since then: in December 2024 MongoDB released version 2.0 of the driver, with a new import path and some breaking changes. The 1.x line has been [officially deprecated](https://www.mongodb.com/docs/drivers/go/v1.x/whats-new/) and only receives bug and security fixes; new features land in v2 only.

So I decided to redo the tutorial with the same example as before (the Marvel heroes and the Sokovia Accords), this time using the current version of the driver (v2.9.2 at the time of writing).

## Installation

With your Go module created (`go mod init`), download the driver. Note the `/v2` in the path:

```bash
go get go.mongodb.org/mongo-driver/v2/mongo
```

## Connecting

Assuming your MongoDB is running with the default configuration (to spin one up quickly: `docker run -d -p 27017:27017 mongo:8`), the connection code looks like this:

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

The most visible difference from v1: there's no more `mongo.NewClient` followed by `client.Connect(ctx)`. It's now a single call to `mongo.Connect`, which **no longer takes a `context`**.

To test the connection we call `Ping`. I also make sure the client is disconnected at the end with `Disconnect`, and use a `context` with a timeout so no operation hangs forever:

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

## The data

Just like in the previous post, we have a DB called `civilact` with a `heroes` collection containing these documents:

```json
{ "name": "Tony Stark",   "alias": "Iron Man",        "signed": true  },
{ "name": "Steve Rogers", "alias": "Captain America", "signed": false },
{ "name": "Vision",       "alias": "Vision",          "signed": true  },
{ "name": "Clint Barton", "alias": "Hawkeye",         "signed": false }
```

And the `struct` that represents a hero. This time with `bson` tags (the ones the driver actually reads) and including the `_id`:

```go
type Hero struct {
	ID     bson.ObjectID `bson:"_id,omitempty"`
	Name   string        `bson:"name"`
	Alias  string        `bson:"alias"`
	Signed bool          `bson:"signed"`
}
```

Note the type is `bson.ObjectID`. In v1 it lived in `primitive.ObjectID`, but the `bson/primitive` package was merged into `bson` in v2. The `omitempty` means that when we insert a hero without an ID, MongoDB generates one.

To avoid repeating the DB and collection names in every function, I created a small helper:

```go
func heroesCollection(client *mongo.Client) *mongo.Collection {
	return client.Database("civilact").Collection("heroes")
}
```

## Finding many documents

The function that returns the heroes takes a `context`, the client and a `bson.M` filter. If the filter is empty, every document in the collection is returned:

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

Unlike the original post, the functions now return the error instead of calling `log.Fatal` inside them. That way the caller decides what to do, and the error from `cur.All` (which used to be ignored) is handled too.

Calling it from `main`:

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

To get only the heroes who signed the [Sokovia Accords](https://marvelcinematicuniverse.fandom.com/wiki/Sokovia_Accords), just change the filter:

```go
heroes, err = ReturnAllHeroes(ctx, client, bson.M{"signed": true})
```

```text
2026/10/06 23:35:44 Tony Stark Iron Man true
2026/10/06 23:35:44 Vision Vision true
```

## Finding one document

To return a single hero we use `FindOne`. There's one thing the old post missed: when no document matches the filter, `Decode` returns `mongo.ErrNoDocuments`. I handle that case by returning `nil`, to tell "not found" apart from "something went wrong":

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

(Don't forget to add `"errors"` to the imports.)

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

## Inserting

To grow our team and add Doctor Strange:

```go
func InsertNewHero(ctx context.Context, client *mongo.Client, hero Hero) (bson.ObjectID, error) {
	result, err := heroesCollection(client).InsertOne(ctx, hero)
	if err != nil {
		return bson.ObjectID{}, err
	}
	return result.InsertedID.(bson.ObjectID), nil
}
```

`InsertedID` is still typed as `any`, so I convert it to `bson.ObjectID`, since MongoDB is the one generating the ID.

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

## Deleting

What if the Sorcerer Supreme doesn't like the idea and wants out? We need a `RemoveOneHero` function:

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

## Updating

Finally, Hawkeye changed his mind and now wants to sign the Accords:

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

## What changed from v1 to v2

A summary of the changes that showed up in this tutorial (the full list is in the [official migration guide](https://github.com/mongodb/mongo-go-driver/blob/master/docs/migration-2.0.md)):

- **Import path:** `go.mongodb.org/mongo-driver/...` became `go.mongodb.org/mongo-driver/v2/...`.
- **Connecting:** `mongo.NewClient` was removed. Use `mongo.Connect(opts)`, which also no longer takes a `context`.
- **`primitive` package:** merged into `bson`. `primitive.ObjectID` became `bson.ObjectID`, `primitive.M` became `bson.M` and so on.
- **Options:** the builders (`options.Find()`, `options.Client()`...) look the same in everyday use (`options.Find().SetLimit(10)`), but under the hood they are now lists of setters. This only matters if you used to manipulate the options structs directly.
- **`InsertMany`:** now accepts any slice (`any`) instead of `[]interface{}`, so you can pass a `[]Hero` directly.
- **`Distinct`:** now returns a result with `Decode`, just like `FindOne`, instead of a `[]interface{}`.
- **`SingleResult.DecodeBytes`:** renamed to `Raw`.

Beyond the driver itself, I also took the chance to modernize the code: `bson` tags on the struct, a `context` with timeout, `Disconnect` at the end, handling `mongo.ErrNoDocuments`, and functions that return `error`.

## Links

- Example code: [eduardohitek/mongodb-go-example](https://github.com/eduardohitek/mongodb-go-example)
- Official driver repository: [mongodb/mongo-go-driver](https://github.com/mongodb/mongo-go-driver)
- Documentation: [pkg.go.dev/go.mongodb.org/mongo-driver/v2/mongo](https://pkg.go.dev/go.mongodb.org/mongo-driver/v2/mongo)
- v1 → v2 migration guide: [migration-2.0.md](https://github.com/mongodb/mongo-go-driver/blob/master/docs/migration-2.0.md)

Any questions or suggestions, reach me on [LinkedIn](https://www.linkedin.com/in/eduardohitek/).
