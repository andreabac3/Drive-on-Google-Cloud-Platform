#!/usr/bin/env bash
mvn clean package appengine:deploy -Dapp.deploy.projectId=drive-cloud-on-gcp -Dapp.deploy.version=1


# https://drive-cloud-on-gcp.appspot.com/

