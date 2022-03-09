# --- functions

# f_copy
f_copy() {
  for f in $1
  do
    echo "Processing (cp) $f -> $DEST/$f"
    cp "$f" "$DEST/$f"
  done
}

# --- main script

DEST=".export"

echo "Deleting previous export..."
rm -rf .export
echo " "

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

# pause
read -p "Press [ENTER] to resume ..."
