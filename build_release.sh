#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "============================================="
echo " Starting NowQR Release Build Process"
echo "============================================="

# Define directories
WORKSPACE_DIR="/home/iqbal-jutt/Nowqr/nowqrscanlogo"
FRONTEND_DIR="$WORKSPACE_DIR/nowqr-frontend"
BACKEND_DIR="$WORKSPACE_DIR/nowqr-backend"
RELEASE_DATE=$(date +%Y-%m-%d)
RELEASE_NAME="nowqr-single-domain-current-$RELEASE_DATE"
RELEASE_DIR="$WORKSPACE_DIR/release/$RELEASE_NAME"
ZIP_FILE="$WORKSPACE_DIR/release/$RELEASE_NAME.zip"

# Step 1: Build Frontend
echo "--> Building frontend in $FRONTEND_DIR..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run build

# Step 2: Create Release Directory
echo "--> Creating release directory at $RELEASE_DIR..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# Step 3: Copy Backend Files (excluding vendor, .git, local env, and caches)
echo "--> Copying backend files..."
rsync -av \
  --exclude='vendor' \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='storage/framework/cache/data/*' \
  --exclude='storage/framework/sessions/*' \
  --exclude='storage/framework/views/*' \
  --exclude='storage/logs/*' \
  --exclude='bootstrap/cache/*.php' \
  "$BACKEND_DIR/" "$RELEASE_DIR/"

# Step 4: Copy Frontend Build to Laravel's Public folder
echo "--> Copying compiled frontend assets to backend public folder..."
mkdir -p "$RELEASE_DIR/public"
cp -r "$FRONTEND_DIR/dist/"* "$RELEASE_DIR/public/"

# Step 5: Zip the Release Folder
echo "--> Zipping release folder to $ZIP_FILE..."
cd "$WORKSPACE_DIR/release"
rm -f "$ZIP_FILE"
zip -r "$RELEASE_NAME.zip" "$RELEASE_NAME"

echo "============================================="
echo " Release Build Completed Successfully!"
echo " ZIP file created at: $ZIP_FILE"
echo "============================================="
