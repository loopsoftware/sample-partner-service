# Example of a partner's service

The example works in assemble with [Sample-invoicing app](https://github.com/loopsoftware/sample-invoicing).
 
### Creating an image

 1. pull latest docker image 
    ```bash 
    docker pull yupana/yupana-partner:latest
    ```
 1. get latest package.json
    ```bash
    mv package.json mypackage.json
    docker run --name partner-base yupana/yupana-partner:latest
    docker cp partner-base:/app/yupana/service/package.json ./package.json
    docker rm -v partner-base
    ```
 1. update `files` section of [package.json](./package.json) to include your files
    ```bash
    vimdiff mypackage.json package.json
    ```
 1. update [Dockerfile](./Dockerfile) to copy your files to the image
 1. build the image
    ```bash
    docker build -t sample-partner ./
    ```  
