# Print raw OSM tags for named paths in the North Bend test area
Q='[out:json][timeout:60];way["highway"~"^(path|footway|track|bridleway|cycleway)$"]["name"](47.3977,-121.8538,47.5934,-121.7199);out tags;'
for u in https://overpass-api.de/api/interpreter https://maps.mail.ru/osm/tools/overpass/api/interpreter https://overpass-api.de/api/interpreter; do
  curl -s -m 90 --data-urlencode "data=$Q" "$u" -o ways.json && jq -e '.elements|length>0' ways.json >/dev/null && break; sleep 5; done
jq -r '.elements | group_by(.tags.name)[] | "\(.[0].tags.name) | n=\(length) | " + ([.[].tags | to_entries[] | select(.key|test("^(name|source|tiger|created_by)")|not) | "\(.key)=\(.value)"] | unique | join(" "))' ways.json
