#!/bin/bash
# xXx TODO - COPYRIGHT

# Generates the temporary files needed for tests to run, putting them in the
# generated/ directory.
#
# Usage:
# $ scripts/testing/generate_test_files.sh

# CD to the root FirebaseUI directory, which should be the parent directory of
# buildtools/.
set -x
echo "$(dirname "$0"))"
echo "$(dirname $(dirname "$0"))"
cd "$(dirname $(dirname "$0"))"

echo "Compiling templates..."
npm run build build-soy
mkdir -p ./generated
cp -r ./out/soy/* ./generated
npm run build clean

echo "Generating dependency file..."
node $(npm bin)/closure-make-deps \
    --closure-path="node_modules/google-closure-library/closure/goog" \
    --file="node_modules/google-closure-library/closure/goog/deps.js" \
    --root="soy" \
    --root="generated" \
    --root="javascript" \
    --root="node_modules/google-closure-templates/javascript" \
    --exclude="generated/all_tests.js" \
    --exclude="generated/deps.js" \
    --exclude="javascript/externs" \
    > generated/deps.js

echo "Generating test HTML files..."
python ./buildtools/gen_test_html.py
python ./buildtools/gen_all_tests_js.py > generated/all_tests.js

echo "Done."
