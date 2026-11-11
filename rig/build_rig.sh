set -e
cd "$(dirname "$0")"
node make_psd.mjs > /dev/null
node mcp.mjs autorig '{"psd_file":"vini.psd","output":"vini.rigby","meshes":"none","ik":true,"roles":{"backpack":"extra"},"overwrite":true}' > /dev/null
node mcp.mjs run_script '{"path":"vini.rigby","script_file":"anims.py"}' | grep -A3 output
rm -rf vini_export && mkdir vini_export && (cd vini_export && unzip -o -q ../vini.rigby images/*)
node mcp.mjs convert_project '{"input":"vini.rigby","output":"vini_export/vini.json","version":"4.2","overwrite":true}' > /dev/null
ls vini_export
mkdir -p ../public/vini && cp -r vini_export/* ../public/vini/ && echo "rig copied to public/vini"
