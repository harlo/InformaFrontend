#! /bin/bash
OLD_DIR=`pwd`

echo "**************************************************"
echo "************** INFORMACAM SETUP **************"

mkdir .users
mkdir conf/.gpg

cp conf/informacam.secrets.json.example conf/informacam.secrets.json

cd lib/Frontend
./setup.sh $OLD_DIR ~/.ssh "ec2-54-83-176-172.compute-1.amazonaws.com" 8888 false

cd web
ln -s $OLD_DIR/web/ extras

cd ../SyncTasks
ln -s $OLD_DIR/SyncTasks/* .

#cd $OLD_DIR/lib/python-gnupg
#make install

cd $OLD_DIR
#pip install --upgrade -r requirements.txt
python informa_frontend.py -firstuse