set -e

mongosh <<EOF
// Read options for initialization
const db_options = [{
  "name": "deploy-mode",
  "conf": false,
  "required": true,
  "values": {
    "type": "str",
    "default": "cluster",
    "range": [
      [
        "cluster",
        "client"
      ]
    ]
  }
},
{
  "name": "master",
  "conf": false,
  "required": true,
  "values": {
    "type": "str",
    "default": null,
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "name",
  "conf": false,
  "required": true,
  "values": {
    "type": "str",
    "default": null,
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "class",
  "conf": false,
  "required": true,
  "values": {
    "type": "str",
    "default": null,
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "spark.executor.instances",
  "conf": true,
  "required": true,
  "values": {
    "type": "int",
    "default": "1",
    "range": [
      [
        "1",
        "10"
      ]
    ]
  }
},
{
  "name": "spark.executor.cores",
  "conf": true,
  "required": true,
  "values": {
    "type": "int",
    "default": "1",
    "range": [
      [
        "1",
        "8"
      ]
    ]
  }
},
{
  "name": "spark.executor.memory",
  "conf": true,
  "required": true,
  "values": {
    "type": "int",
    "default": "512",
    "range": [
      [
        "512",
        "10240"
      ]
    ]
  }
},
{
  "name": "spark.kubernetes.container.image",
  "conf": true,
  "required": true,
  "values": {
    "type": "str",
    "default": "apache/spark:3.5.0",
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "spark.kubernetes.driver.node.selector.kubernetes.io/hostname",
  "conf": true,
  "required": true,
  "values": {
    "type": "str",
    "default": "k8s-1",
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "spark.kubernetes.authenticate.driver.serviceAccountName",
  "conf": true,
  "required": true,
  "values": {
    "type": "str",
    "default": "spark",
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "executable",
  "conf": false,
  "required": true,
  "values": {
    "type": "str",
    "default": "local:///opt/spark/examples/jars/spark-examples_2.12-3.5.0.jar",
    "range": [
      [
        ""
      ]
    ]
  }
},
{
  "name": "spark_path",
  "conf": false,
  "required": true,
  "values": {
    "type": "str",
    "default": "/opt/spark/bin/spark-submit",
    "range": [
      [
        ""
      ]
    ]
  }
}];

// Create a new database and switch to it
db = db.getSiblingDB('$MONGO_INITDB_DATABASE');

// Create a new collection and insert documents
db.οptions.insertMany(db_options);
db.createCollection('Jobs', {"name": "test"});
EOF