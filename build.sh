# --- functions

# f_copy
f_copy() {
  for f in $1
  do
    echo "Processing (cp) $f -> $DEST/$f"
    cp "$f" "$DEST/$f"
  done
}

# f_uglify
f_uglify() {
  for f in $1
  do
    echo "Processing (uglifyjs) $f -> $DEST/$f"
    uglifyjs -c -o "$DEST/$f" "$f"
  done
}

# --- main script

DEST=".export"

echo "Make sure directory structure exists"
mkdir -p .export/{src,lib}
echo " "

echo "TypeScript compile"
tsc
echo " "

# copy files

f_copy "lib/*.js"
f_copy "src/*.js"

for f in "icon128.png" "icon48.png" "icon16.png" "manifest.json"
do
  f_copy $f
done
