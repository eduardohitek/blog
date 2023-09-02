---
title: "Habilitando Logs Query no Mongodb utilizando Go"
date: 2023-09-02T00:55:35-03:00
draft: false
cover: "images/2023-09-02-habilitando-logs-query-mongodb-go/1.png"
coverAlt: "Recorte de logs de query do MongoDB"
coverCaption: "Recorte de logs de query do MongoDB"
tags: ["mongodb", "go", "golang", "logs", "query"]
categories: ["golang", "tutorial", "mongodb"]
---

Uma das formas de debugar uma aplicação é através dos logs. Eles podem ser usados para identificar problemas, entender o fluxo de execução e também para monitorar o comportamento da aplicação. Dentre os seus tipos, os logs de query de banco de dados são muito úteis para entender o que está acontecendo com consultas e outras operações de escrita. Neste post vou mostrar como habilitar os logs de query do MongoDB no driver oficial para Go.

Por padrão, os logs no driver oficial do MongoDB para Go são desabilitados. Para habilitá-los, basta usar implementar o seu próprio `CommandMonitor` e setá-lo na configuração do `ClientOptions`.

Sempre que trabalho com conexão de banco de dados, gosto de criar uma struct que serve para conter as informações necessárias para a conexão. Nesse caso, vou criar uma struct chamada `MongoConfig`.

```go
type MongoConfig struct {
	URL       string       // URL de conexão com o MongoDB
	AppName   string       // Nome da aplicação
	DebugMode bool         // Flag que habilita os logs de debug
	Log       slog.Logger  // Logger que será utilizado
}
```

Após isso, eu implemento uma função `createMongoClient` chamada que recebe essa struct de Configuração e retorna um `*mongo.Client`. A vantagem de passar as configurações via struct é caso você queira adicionar outros parâmetros como `ConnectionTimeout` ou `MaxPoolSize` por exemplo, você não precisa alterar a assinatura da função de conexão.

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

Após isso eu utilizo a função para criar o client do MongoDB e executar operações na minha aplicação.

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

Exemplos de logs de algumas operações:

```
PING
2023/09/02 08:48:09 INFO {"ping": {"$numberInt":"1"},"lsid": {"id": {"$binary":{"base64":"HBu0mDZaRHaNx0TPpBcaeg==","subType":"04"}}},"$db": "admin"}

INSERT
2023/09/02 09:04:43 INFO {"insert": "users","ordered": true,"lsid": {"id": {"$binary":{"base64":"ZIZW5N5OR+ympGFggFu6uA==","subType":"04"}}},"$db": "example-mongo","documents": [{"_id": {"$oid":"64f324db99a1dac5fdc37251"},"name": "Eduardo","alias": "eduardohitek","site": "https://eduardohitek.dev"}]}

FIND
2023/09/02 09:05:59 INFO {"find": "users","filter": {"alias": "eduardohitek"},"lsid": {"id": {"$binary":{"base64":"+ji9+sJIRVC0HsawBmTAPw==","subType":"04"}}},"$db": "example-mongo"}
```

Aqui está um **[gist](https://gist.github.com/eduardohitek/000326c951ffce59bb03339b41e4d601)** com o código utilizado no post.
