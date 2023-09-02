---
title: "Enabling Logs Query in Mongodb using Go"
date: 2023-09-02T00:55:35-03:00
draft: false
cover: "images/2023-09-02-habilitando-logs-query-mongodb-go/1.png"
coverAlt: "Mongodb query logs snippet"
coverCaption: "Mongodb query logs snippet"
tags: ["mongodb", "go", "golang", "logs", "query"]
categories: ["golang", "tutorial", "mongodb"]
---

One way to debug an application is through logs. They can be used to identify issues, understand the execution flow, and also monitor the application's behavior. Among their types, database query logs are very useful for understanding what is happening with queries and other write operations. In this post, I will show how to enable MongoDB query logs in the official Go driver.

By default, logs in the official MongoDB driver for Go are disabled. To enable them, you just need to implement your own CommandMonitor and set it in the ClientOptions configuration.

Whenever I work with database connections, I like to create a struct that holds the necessary connection information. In this case, I'll create a struct called MongoConfig.

```go
type MongoConfig struct {
	URL       string       // MongoDB connection URL
	AppName   string       // Application name
	DebugMode bool         // Flag to enable debug logs
	Log       slog.Logger  // Logger to be used
}
```

After that, I implement a createMongoClient function that takes this configuration struct and returns a *mongo.Client. The advantage of passing configurations via a struct is that if you want to add other parameters like ConnectionTimeout or MaxPoolSize, for example, you don't need to change the function's signature.

```go
func createMongoClient(cfg MongoConfig) (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI(cfg.URL)
	clientOptions.SetAppName(cfg.AppName)

	if cfg.DebugMode { // Verifico se a flag de debug está habilitada
		monitor := &event.CommandMonitor{
			Started: func(_ context.Context, e *event.CommandStartedEvent) {
				if e.CommandName != "endSessions" { // Ignoro os comandos de finalização de sessão
					cfg.Log.Info(e.Command.String())
				}
			},
		}

		clientOptions.SetMonitor(monitor)
	}

	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		return nil, err
	}

	return client, nil
}
```

Afterward, I use the function to create the MongoDB client and perform operations in my application.

```go
mongoCfg := MongoConfig{
		URL:       "mongodb://localhost:27017",
		AppName:   "MongoDB with query log",
		DebugMode: true,
		Log:       *slog.Default(),
	}

	client, err := createMongoClient(mongoCfg)
	if err != nil {
		log.Fatal(err)
	}
```

Examples of logs for some operations:

```
PING
2023/09/02 08:48:09 INFO {"ping": {"$numberInt":"1"},"lsid": {"id": {"$binary":{"base64":"HBu0mDZaRHaNx0TPpBcaeg==","subType":"04"}}},"$db": "admin"}

INSERT
2023/09/02 09:04:43 INFO {"insert": "users","ordered": true,"lsid": {"id": {"$binary":{"base64":"ZIZW5N5OR+ympGFggFu6uA==","subType":"04"}}},"$db": "example-mongo","documents": [{"_id": {"$oid":"64f324db99a1dac5fdc37251"},"name": "Eduardo","alias": "eduardohitek","site": "https://eduardohitek.dev"}]}

FIND
2023/09/02 09:05:59 INFO {"find": "users","filter": {"alias": "eduardohitek"},"lsid": {"id": {"$binary":{"base64":"+ji9+sJIRVC0HsawBmTAPw==","subType":"04"}}},"$db": "example-mongo"}
```

Here is a **[gist](https://gist.github.com/eduardohitek/000326c951ffce59bb03339b41e4d601)** with the code used in the post.
