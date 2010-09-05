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
    this.createMenu('month', this.MONTHS);
    this.createMenu('year', years, true);
    
    $('form').submit(function() {
      Gramophone.search();
      return false;
    });
  },
  
  createMenu: function(id, values, selectLast) {
    var container = $('.' + id),
        select    = '<select id="' + id + '" name="' + id + '">';
    
    for (var i = 0, n = values.length; i < n; i++) {
      var optionValue = (typeof values[i] === 'string') ? i + 1 : values[i];
      select += '<option value="' + optionValue + '">' + values[i] + '</option>'
    }
    select += '</select>';
    container.html(select);
    
    if (selectLast) {
      var last = values[values.length-1];
      container.find('option[value=' + last + ']')[0].selected = true;
    }
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
    songs.sort(Gramophone.compareSongs);
    
    var playlist = $('.playlist ul');
    playlist.html('');
    $.each(songs, function(i, song) {
      var songListing = $('<li>' + song.artist + ' - ' + song.song + '</li>');
      songListing.click(function() {
        songListing.addClass('searching');
        Gramophone.play(song, function(found) {
          songListing.removeClass('searching');
          songListing.addClass(found ? 'playing' : 'failed');
        });
      });
      playlist.append(songListing);
    });
  },
  
  play: function(song, callback) {
    var self = this;
    
    $.getJSON('/track', {artist: song.artist, title: song.song}, function(response) {
      if (!response.preview) return callback(false);
      
      self._map.openInfoWindowHtml(new GLatLng(song.lat, song.lng),
          '<div class="track">' +
            '<img src="' + response.album.image.replace(/_\d+\.jpg$/, '_200.jpg') + '">' + 
            '<span class="artist">' + response.artist + '</span>' +
            '<span class="title">' + response.title + '</span>' +
            '<span class="album">(' + response.album.title + ')</span>' +
            '<span class="venue">@ ' + song.venue + '</span>' +
          '</div>');
      
      $('.playlist li').removeClass('playing');
      if (self._currentSound) self._currentSound.stop();
      
      self._currentSound = soundManager.createSound({
        id:       response.title,
        url:      response.preview,
        onfinish: function() {
          $('.playlist li').removeClass('playing');
          self._map.closeInfoWindow();
        }
      });
      self._currentSound.play();
      
      callback(true);
    });
  },
  
  compareSongs: function(a, b) {
    return a.artist < b.artist ?
           -1 :
           a.artist > b.artist ?
           1 :
           a.song < b.song ?
           -1 :
           a.song > b.song ?
           1 : 0;
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

