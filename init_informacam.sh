OLD_DIR=`pwd`
ANNEX_DIR=$1
CONF_DIR=$OLD_DIR/conf
REMOTE=user@host:/root

# write any p12s or jsons to secrets.json and delete them, or scp forms to annex
for f in $CONF_DIR/*
do
	echo $f
	if echo "$f" | grep '^informacam.repository.*' > /dev/null
	then
		SV=$(python -c "from Utils.funcs import saveInformaCamDirective; print saveInformaCamDirective('"$f"');")
	fi
	
	if echo "$f" | grep '^informacam.form*' > /dev/null
	then
		scp $CONF_DIR/$f $REMOTE/forms
	fi
done

# delete private key; we don't need/want it on server and it's already in keyring
#rm $GPG_PRIV_KEY