# Dockerfile for NESTJS Application

## Install Docker Desktop

Before you begin, ensure that you have Docker Desktop installed on your machine. You can download it from the official Docker website: [Docker Desktop](https://www.docker.com/products/docker-desktop).

## Dockerfile Overview

The `Dockerfile` provided in this directory is designed to create a Docker image for the NESTJS application.

This Dockerfile builds a Docker image for the NESTJS application.

## Login to Docker Hub

Before pushing the Docker image to Docker Hub, you need to log in to your Docker Hub account. Use the following command to log in:

```bash
docker login
```

You will be prompted to enter your Docker Hub username and password.

## Build the Docker Image

To build the Docker image, navigate to the directory containing the `Dockerfile` and run the following command:

```bash
docker build -t thanhtungo/claude-code-nestjs-api:latest -f Dockerfile .
```

## Push the Docker Image to Docker Hub

After building the Docker image, you can push it to Docker Hub using the following command:

```bash
docker push thanhtungo/claude-code-nestjs-api:latest

```

## Pull the Docker Image from Docker Hub

If you want to pull the Docker image from Docker Hub, you can use the following command:

```bash
docker pull thanhtungo/claude-code-nestjs-api:latest
```

## Run with Docker Compose

To run the NESTJS application using Docker Compose, you can use the following command. Make sure you have Docker Compose installed and the `docker-compose.yml` file is correctly configured.

```bash
docker compose -p claude-code-nestjs-api -f docker/docker-compose.yml up
```

## Stop and Remove Containers

To stop and remove the containers created by Docker Compose, use the following command:

```bash
docker compose -p claude-code-nestjs-api -f docker/docker-compose.yml down
```

## Stop and Remove Containers with Volumes

To stop and remove the containers along with their associated volumes, use the following command:

```
docker-compose down -v
```
