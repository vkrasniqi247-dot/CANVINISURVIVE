# regenerates src/voFiles.js from the narration clips present in public/audio/vo/
cd "$(dirname "$0")/.." && echo "export const VO_FILES = [$(ls public/audio/vo/*.mp3 2>/dev/null | xargs -n1 basename | sed 's/\.mp3$//;s/.*/"&"/' | paste -sd,)];" > src/voFiles.js && cat src/voFiles.js
