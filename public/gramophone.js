Gramophone = {
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November',
           'December'],
  
  MIN_YEAR: 1960,
  
  boot: function() {
    this.bootForm();
    this.bootMap();
    this.search();
  },
  
  bootForm: function() {
    var years = [], year = this.MIN_YEAR;
    while (year <= new Date().getFullYear()) {
      years.push(year);
      year += 1;
    }
    this._createMenu('month', this.MONTHS);
    this._createMenu('year', years);
    
    $('form').submit(function() {
      Gramophone.search();
      return false;
    });
  },
  
  _createMenu: function(id, values) {
    var container = $('.' + id),
        select    = '<select id="' + id + '" name="' + id + '">';
    
    for (var i = 0, n = values.length; i < n; i++) {
      var optionValue = (typeof values[i] === 'string') ? i + 1 : values[i];
      select += '<option value="' + optionValue + '">' + values[i] + '</option>'
    }
    select += '</select>';
    container.html(select);
  },
  
  bootMap: function() {
    var mapBox = $('.map')[0],
        center = new GLatLng(51.515193, -0.086345),
        map    = new GMap2(mapBox);
    
    map.setCenter(center, 13);
    map.addControl(new GLargeMapControl());
    
    map.enableDragging();
    map.enableDoubleClickZoom();
    map.enableContinuousZoom();
    map.enableScrollWheelZoom();
    
    this._map = map;
  },
  
  search: function() {
    var params = {month: $('#month').val(), year: $('#year').val()},
        bounds = this._map.getBounds();
    
    params.min_lat = bounds.getSouthWest().lat();
    params.max_lat = bounds.getNorthEast().lat();
    params.min_lng = bounds.getSouthWest().lng();
    params.max_lng = bounds.getNorthEast().lng();
    
    $('.playlist ul').html('<li>Searching...</li>');
    Gramophone.JSONP.request('http://dc1.songkick.com/songs', params, function(response) {
      Gramophone.updatePlaylist(response);
    });
  },
  
  updatePlaylist: function(songs) {
    var playlist = $('.playlist ul');
    playlist.html('');
    $.each(songs, function(i, song) {
      var songListing = $('<li>' + song.artist + ' - ' + song.song + '</li>');
      songListing.click(function() {
        Gramophone.play(song.artist + ' ' + song.song);
      });
      playlist.append(songListing);
    });
  },
  
  play: function(title) {
    $.getJSON('/mp3', {title: title}, function(response) {
      if (!response.url) return;
      soundManager.play(title, response.url);
    });
  },
  
  JSONP: {
    request: function(url, params, callback, scope) {
      var head   = document.getElementsByTagName('head')[0],
          script = document.createElement('script'),
          name   = this.getCallbackName();
      
      for (var key in params) {
        url += (url.indexOf('?') < 0) ? '?' : '&';
        url += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }
      
      var handler = function(response) {
        window[name] = undefined;
        try { delete window[name] } catch (e) {}
        callback.call(scope, response);
      };
      
      window[name] = handler;
      
      script.type = 'text/javascript';
      script.src  = url + '&jsonp=' + name;
      head.appendChild(script);
      
      if (window.console) console.info('GET ' + url);
    },
    
    getCallbackName: function() {
      this.__n__ += 1;
      return '__jsonpcallback' + this.__n__ + '__';
    },
    
    __n__: 0
  }
};

