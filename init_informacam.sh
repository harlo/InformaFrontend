OLD_DIR=`pwd`
ANNEX_DIR=$1
CONF_DIR=$OLD_DIR/conf

# write any p12s or jsons to secrets.json and delete them, or mv forms to annex
for f in $CONF_DIR/*
do
	echo $f
	if echo "$f" | grep '^informacam.repository.*' > /dev/null
	then
		SV=$(python -c "from Utils.funcs import saveInformaCamDirective; print saveInformaCamDirective('"$f"');")
	fi
	
	if echo "$f" | grep '^informacam.form*' > /dev/null
	then
		mv $CONF_DIR/$f $ANNEX_DIR/
	fi
done

# save ictd, gpg public key to local_remote
mv $CONF_DIR/informacam.ictd.yaml $ANNEX_DIR/
mv $CONF_DIR/informacam.gpg.pub_key.file $ANNEX_DIR/

# delete private key; we don't need/want it on server and it's already in keyring
#rm $GPG_PRIV_KEY