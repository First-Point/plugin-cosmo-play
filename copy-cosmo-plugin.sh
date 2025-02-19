#!/bin/bash

# Source and destination paths
SOURCE_DIR="../plugin-cosmo-play"
DEST_DIR="../eliza/packages/plugin-cosmo-play"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory $SOURCE_DIR does not exist"
    exit 1
fi

# Create destination parent directory if it doesn't exist
mkdir -p "../eliza/packages"

# Remove destination directory if it exists
if [ -d "$DEST_DIR" ]; then
    echo "Removing existing destination directory..."
    rm -rf "$DEST_DIR"
fi

# Copy the directory
echo "Copying $SOURCE_DIR to $DEST_DIR..."
cp -r "$SOURCE_DIR" "$DEST_DIR"

echo "Copy completed successfully!" 