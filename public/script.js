function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
if (getCookie("auth") !== "") {
  document.querySelector("#map-editor-link").style.display = "block";
}

var map;

var settings = {
  projection: 'equirectangular',
  interactive: false,
  borders: true
}
function setSetting(setting, value) {
  settings[setting] = value;
  localStorage.setItem('settings', JSON.stringify(settings));
}
window.addEventListener('load', e => {
  settings = JSON.parse(localStorage.getItem("settings"));
  if (!settings) {
    settings = settings = {
      projection: 'equirectangular',
      interactive: false,
      borders: true
    }
  }

  document.querySelector(`option[value="${settings.projection}"]`).selected = true;

  document.querySelector("#toggle-interactive").checked = settings.interactive;
  document.querySelector("#toggle-borders").checked = settings.borders;

  loadMap();
});

function loadMap() {
  mapboxgl.accessToken = 'pk.eyJ1Ijoic2tyb25rbW9uc3RlcjEyMyIsImEiOiJja3h5emVhdjcwNmxvMm5tODU1dHU3ZXRrIn0.key2JwbgXVBJbWx_WId6hA';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/skronkmonster123/cl5ynhrp8001u14lfa629qq5k',
    projection: settings.projection,
    center: [7.651961862682725, 0.46375526440465364],
    interactive: settings.interactive
  });
  map.setZoom(1.6);

  var territories;
  fetch('../territories.json')
    .then(res => res.json())
    .then(txt => { territories = txt })

  map.on('load', function() {
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
              'fill-opacity': settings.borders? 0.4 : 1,
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
          map.addSource(fragment + "-source" + Object.keys(territories[territory].fragments).indexOf(fragment), {
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
            'source': fragment + "-source" + Object.keys(territories[territory].fragments).indexOf(fragment),
            'paint': {
              'fill-color': territories[territory].color,
              'fill-opacity': settings.borders? 0.4 : 1,
            }
          });
        }
    }

    let legendString = Object.keys(territories).map(territory => {
      return `<span style="color:${territories[territory].color}">&#9632;</span> ${territory}`
    }).join(" | ");
    document.querySelector("#legend").innerHTML = legendString;
  });
}

document.querySelector("#settings-button").onclick = function() {
  document.querySelector("#settings-menu").classList.toggle("settings-menu-show");
}
document.querySelector("#close-settings-menu").onclick = function() {
  document.querySelector("#settings-menu").classList.toggle("settings-menu-show");
}

document.querySelector("#select-projection").onchange = function() {
  let value = document.querySelector("#select-projection").value;
  setSetting('projection', value);
  map.setProjection(value);
}
document.querySelector("#toggle-interactive").onchange = function() {
  let value = document.querySelector("#toggle-interactive").checked;
  setSetting('interactive', value);
  setTimeout(_ => location.reload(), 500);
}
document.querySelector("#toggle-borders").onchange = function() {
  let value = document.querySelector("#toggle-borders").checked;
  setSetting('borders', value);
  setTimeout(_ => location.reload(), 500);
}