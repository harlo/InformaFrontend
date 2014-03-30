#! /bin/bash
OLD_DIR=`pwd`
LOCAL_CONFIG=$OLD_DIR/conf/informa.config.yaml


#cd lib/Server
#./setup.sh
#cd $OLD_DIR

cd lib/Frontend
./setup.sh $OLD_DIR informa_frontend
cd web
ln -s ../../../web/ extras
cd $OLD_DIR