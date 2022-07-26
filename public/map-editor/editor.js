var isCreatingFragment = false;
var fragmentCoords = [];

mapboxgl.accessToken = 'pk.eyJ1Ijoic2tyb25rbW9uc3RlcjEyMyIsImEiOiJja3h5emVhdjcwNmxvMm5tODU1dHU3ZXRrIn0.key2JwbgXVBJbWx_WId6hA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/skronkmonster123/cl5ynhrp8001u14lfa629qq5k',
    projection: 'equirectangular',
    center: [7.651961862682725, 0.46375526440465364],
    interactive: true
});
map.setZoom(0.5);

var addingToTerritory;

var territories;
fetch('../territories.json')
  .then(res => res.json())
  .then(txt => { territories = txt })

map.on('load', function() {
  showTerritoryLists();
    for (let territory of Object.keys(territories)) {
        map.addLayer(
            {
              id: territory,
              source: {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1',
              },
              'source-layer': 'country_boundaries',
              type: 'fill',
              paint: {
                'fill-color': territories[territory].color,
                'fill-opacity': 0.4,
              },
            },
            'country-label'
          );
          map.setFilter(territory, [
              "in",
              "iso_3166_1_alpha_3",
              ...(territories[territory].countries)
          ]);

          for (let fragment of Object.keys(territories[territory].fragments)) {
            map.addSource(fragment + "-source", {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'geometry': {
                  'type': 'Polygon',
                  // These coordinates outline Maine.
                  'coordinates': [
                    [
                      ...(territories[territory].fragments[fragment])
                    ]
                  ]
                }
              }
            });
            map.addLayer({
              'id': fragment,
              'type': 'fill',
              'source': fragment + "-source",
              'paint': {
                'fill-color': territories[territory].color,
                'fill-opacity': 0.4,
              }
            });
          }
    }

    map.on('click', e => {
      if (isCreatingFragment) {
        let coord = Object.values(e.lngLat.wrap())
        fragmentCoords.push(coord);
        map.getSource('creating-fragment-source').setData(
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              'coordinates': [
                [...fragmentCoords]
              ]
            }
          }
        )
      }
    });
});

const countriesContainter = document.querySelector("#countries");

function showTerritoryLists() {
  for (let territory of Object.keys(territories)) {
    let elmt = document.createElement("div");

    let heading = document.createElement("h3");
    heading.innerText = territory;
    heading.style.cursor = "pointer";
    heading.onclick = function() {
      document.querySelector(`#${territory.replaceAll(" ", "-").replaceAll("(", "-").replaceAll(")","-")}-content`).classList.toggle("hide");
    }
    elmt.appendChild(heading);

    let content = document.createElement("div");
    content.id = territory.replaceAll(" ", "-").replaceAll("(", "-").replaceAll(")","-") + "-content";
    content.classList.add("hide");

    let list = document.createElement('ul');
    for (let country of territories[territory].countries) {
      let li = document.createElement("li");
      li.innerText = countriesByCode[country];
      li.oncontextmenu = async function(e) {
        if (!window.confirm(`Are you sure you want to delete ${countriesByCode[country]} from ${territory}`)) return;
        e.preventDefault();
        let res = fetch(`/remove-country?country=${country}`, {method: 'POST'});
        location.reload();
      }
      list.appendChild(li);
    }
    for (let fragment of Object.keys(territories[territory].fragments)) {
      let li = document.createElement("li");
      li.innerText = fragment + " (fragment)"
      li.oncontextmenu = async function(e) {
        if (!window.confirm(`Are you sure you want to delete ${fragment} from ${territory}`)) return;
        e.preventDefault();
        let res = fetch(`/remove-fragment?fragmentName=${fragment}`, {method: 'POST'});
        location.reload();
      }
      list.appendChild(li);
    }
    content.appendChild(list);

    let addCountryButton = document.createElement("button");
    addCountryButton.innerText = "Add Country";
    addCountryButton.classList.add("add-button");
    addCountryButton.onclick = function() {
      addingToTerritory = territory;

      document.querySelectorAll(".add-button").forEach(button => {
        button.style.display = 'none';
      });

      document.querySelector("#add-country").style.display = 'block';
      document.querySelector("#add-country-button").innerText = "Add Country to " + territory;
    }
    content.appendChild(addCountryButton);

    let addFragmentButton = document.createElement("button");
    addFragmentButton.innerText = "Add Fragment";
    addFragmentButton.classList.add("add-button");
    addFragmentButton.onclick = function() {
      addingToTerritory = territory;

      document.querySelectorAll(".add-button").forEach(button => {
        button.style.display = 'none';
      });

      document.querySelector("#add-fragment").style.display = 'block';
      document.querySelector("#add-fragment-button").innerText = "Add Fragment to " + territory;

      document.querySelector(".mapboxgl-control-container").style.cursor = "crosshair";

      map.addSource('creating-fragment-source', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              []
            ]
          }
        }
        })

      map.addLayer({
        'id': "creating-fragment",
        'type': 'fill',
        'source': 'creating-fragment-source',
        'paint': {
          'fill-color': territories[addingToTerritory].color,
          'fill-opacity': 0.5,
        }
      });

      isCreatingFragment = true;
    }
    content.appendChild(addFragmentButton);

    elmt.appendChild(content);
    countriesContainter.appendChild(elmt);
  }
}

document.querySelector("#add-country-button").onclick = async function() {
  let countryCode = document.querySelector("#country-select").value;
  let res = await fetch(`/add-country?territory=${encodeURIComponent(addingToTerritory)}&country=${countryCode}`, {method: 'POST'});
  location.reload();
}
document.querySelector("#cancel-add-country-button").onclick = function() {
  location.reload();
}

document.querySelector("#add-fragment-button").onclick = async function() {
  let fragmentName = document.querySelector("#input-fragment-name").value.trim();
  if (fragmentName == "") { alert("Please input a name for the fragment!"); return }

  let res = await fetch(`/add-fragment?territory=${encodeURIComponent(addingToTerritory)}&fragmentName=${encodeURIComponent(fragmentName)}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({coords: fragmentCoords})});
  location.reload();
}
document.querySelector("#cancel-add-fragment-button").onclick = function() {
  location.reload();
}