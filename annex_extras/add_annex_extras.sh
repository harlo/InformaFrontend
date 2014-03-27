#! /bin/bash
ANNEX_ROOT=$1

git clone git@github.com:FFmpeg/FFmpeg.git $ANNEX_ROOT/lib/FFmpeg
git clone git@github.com:harlo/Jpeg-Redaction-Library.git $ANNEX_ROOT/lib/jpeg-redaction-library
git clone git@github.com:n8fr8/JavaMediaHasher.git $ANNEX_ROOT/lib/JavaMediaHasher
git clone git@github.com:isislovecruft/python-gnupg.git $ANNEX_ROOT/lib/python-gnupg