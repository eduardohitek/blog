---
title: "Installing Portainer"
date: 2021-07-17T10:36:55-03:00
draft: false
tags: ["docker", "portainer", "tutorial", "english"]
categories: ["general", "docker", "tutorial", "english"]
---

[Portainer](https://www.portainer.io/products/community-edition) is an Open Source application for managing Docker on local machines or servers.
Through its graphical interface it is possible to view and edit your Containers, Images, Volumes and so on. And its installation is very easy as it is distributed as a Docker image.

Just perform the following steps:

1) Create a `volume` to persist your settings:
```
docker volume create portainer_data
```
1) Run the docker command to create the container and inform some initial configuration parameters:
```
docker run -d -p 9000:9000 --name=portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce
```
With this command we are telling Docker to run this container in the background mode, export port 9000, set the name to `portainer`, set the restart policy to always restart and link the container volumes to local volumes on your machine.

After executing the command, just access http://localhost:9000 and set the admin password.

![Set Portainer Access Password](/images/portainer/1.png)

The next step is to point which environment you want to manage, in my case I will select the local docker instance.

![Select environment for management](/images/portainer/2.png)

And that's it, you'll have the lists of active containers, their status and possible available actions.

![List of containers](/images/portainer/3.png)
