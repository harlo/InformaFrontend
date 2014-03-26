#! /bin/bash
OLD_DIR=`pwd`
LOCAL_CONFIG=$OLD_DIR/conf/local.config.yaml

echo "What's the full path to your ssh folder?"
echo "(usually, ~/.ssh)"
read SSH_HOME
echo ssh_root: $SSH_HOME > $LOCAL_CONFIG

cd lib/Server
./setup.sh $OLD_DIR informa_server

cd $OLD_DIR
echo `pwd`