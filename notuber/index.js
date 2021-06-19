var map;
var myLatLng;
var shortestDistance = Infinity;
var carMarkers = [];
var cars;
var closestCar;
var infowindow;

distance = (a, b) => (google.maps.geometry.spherical.computeDistanceBetween(a, b)/1609.344).toString();

function initMap() {
    infowindow = new google.maps.InfoWindow();
    navigator.geolocation.getCurrentPosition(myCoord => {
        myLatLng = new google.maps.LatLng({lat: myCoord.coords.latitude, lng: myCoord.coords.longitude});
        map = new google.maps.Map(document.getElementById("map"), {
            center: myLatLng,
            zoom: 14,
            minZoom: 1
        });

        const myMarker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            icon: "https://img.icons8.com/cute-clipart/64/000000/home.png"
        });

        vehicle_request = new XMLHttpRequest();
        vehicle_request.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                cars = JSON.parse(this.response);
                cars.map(car => {
                    d = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, new google.maps.LatLng({lat: car['lat'], lng: car['lng']}));
                    if (d < shortestDistance) {
                        closestCar = car;
                        shortestDistance = d;
                    }
                    carMarkers.push(new google.maps.Marker({
                        position: {lat: car['lat'], lng: car['lng']},
                        map: map,
                        icon: "./car.png"
                    }));
                });
                carMarkers.map((marker, i) => {
                    google.maps.event.addListener(marker, 'click', function() {
                        d = distance(myLatLng, marker.getPosition());
                        car_infowindow = new google.maps.InfoWindow({
                            content: `<h2>Vehicle</h2><ul><li>username: ${cars[i]['username']}<li>ID: ${cars[i]['id']}<li>Distance: ${d} miles</ul>`
                        });
                        car_infowindow.open(map, marker);
                    });
                })
            }
        }
        vehicle_request.open('POST', 'https://jordan-marsh.herokuapp.com/rides', true);
        vehicle_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        vehicle_request.send("username=JPgy9YNN&lat="+myCoord.coords.latitude+"&lng="+myCoord.coords.longitude);

        const meInfowindow = new google.maps.InfoWindow({
            content: "NA",
        });
        
        myMarker.addListener("click", () => {
            if (closestCar != undefined) {
                htmlContent = `<h2>Closest Vehicle</h2><ul><li>username: ${closestCar['username']}<li>ID: ${closestCar['id']}<li>Distance: ${(shortestDistance/1609.344).toString()} miles</ul>`;
                meInfowindow.setContent(htmlContent);

                const path = new google.maps.Polyline({
                    path: [myLatLng, {lat: closestCar['lat'], lng: closestCar['lng']}],
                    geodesic: true,
                    strokeColor: "#FF0000",
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                });
                path.setMap(map);
            }
            meInfowindow.open(map, myMarker);
        });

        const food_request = {
            location: myLatLng,
            radius: 1609.344,
            type: ["restaurant", "bar", "cafe"],
          };
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(food_request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                results.map(result => {
                    console.log(result['name']);
                    createMarker(result);
                });
            }
        });
    });
    
}

function createMarker(place) {
    if (!map || !myLatLng || !place.geometry || !place.geometry.location) return;
    const marker = new google.maps.Marker({
      map,
      position: place.geometry.location,
    });
    google.maps.event.addListener(marker, "click", () => {
      infowindow.setContent(place['name']);
      infowindow.open(map, marker);
    });
  }