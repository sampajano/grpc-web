#!/bin/bash
# xXx TODO - COPYRIGHT

# Generates the temporary files needed for tests to run, putting them in the
# generated/ directory.
#
# Usage:
# $ scripts/testing/generate_test_files.sh

set -ex

SCRIPT_DIR=$(dirname "$0")
REPO_DIR=$(realpath "${SCRIPT_DIR}/../")
JAVASCRIPT_DIR=$(realpath "${SCRIPT_DIR}/../../../javascript")

# CD to the root directory.
cd "$REPO_DIR"

# echo "Compiling templates..."
# npm run build build-soy
# mkdir -p ./generated
# cp -r ./out/soy/* ./generated
# npm run build clean

# TODO: xXx
GEN_DIR="$REPO_DIR/generated"
mkdir -p "$GEN_DIR"

echo "Generating dependency file..."
$(npm bin)/closure-make-deps \
    --closure-path="node_modules/google-closure-library/closure/goog" \
    --file="node_modules/google-closure-library/closure/goog/deps.js" \
    --root="$JAVASCRIPT_DIR" \
    --exclude="$GEN_DIR/all_tests.js" \
    --exclude="$GEN_DIR/deps.js" \
    > "$GEN_DIR/deps.js"

echo "Generating test HTML files..."
python ./scripts/gen_test_html.py
#python ./scripts/gen_all_tests_js.py > generated/all_tests.js

echo "Done."
