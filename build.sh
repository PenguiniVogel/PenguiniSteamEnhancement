echo "Make sure directory structure exists"
mkdir -p .export/listings
echo " "

echo "TypeScript compile"
tsc
echo " "

DEST=".export"

# copy files
for f in "icon128.png" "icon48.png" "icon16.png" "Util.js" "listings/listings.js"
do
  echo "Processing (cp) $f -> $DEST/$f"
  cp "$f" "$DEST/$f"
done
