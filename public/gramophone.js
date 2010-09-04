Gramophone = {
  boot: function() {
    this.bootMap();
    $('h1').click(function() { Gramophone.play('Beatles Help') });
  },
  
  bootMap: function() {
    var mapBox = $('.map')[0],
        center = new GLatLng(40.768581, -73.934555),
        map    = new GMap2(mapBox);
    
    map.setCenter(center, 11);
    map.addControl(new GLargeMapControl());
    
    map.enableDragging();
    map.enableDoubleClickZoom();
    map.enableContinuousZoom();
    map.enableScrollWheelZoom();
    
    this._map = map;
  },
  
  play: function(title) {
    $.getJSON('/mp3', {title: title}, function(response) {
      if (!response.url) return;
      soundManager.play(title, response.url);
    });
  }
};

