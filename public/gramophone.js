Gramophone = {
  play: function(title) {
    $.getJSON('/mp3', {title: title}, function(response) {
      alert(response.url);
      soundManager.play(title, response.url);
    });
  }
};

