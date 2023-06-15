---
title: "Backup e restore de Banco de dados no Heroku"
date: 2021-04-06T13:21:42-03:00
draft: false
---

```
heroku pg:backups:capture -a app_name
heroku pg:backups:download -a app_name
python3 -m http.server 8000
ngrok http 8000
heroku pg:backups:restore http://524f526628c7.ngrok.io/latest.dump DATABASE_URL -a app_name --confirm
```
