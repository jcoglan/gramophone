Gramophone = {
  play: function(title) {
    $.getJSON('/mp3', {title: title}, function(response) {
      if (!response.url) return;
      soundManager.play(title, response.url);
    });
  }
};

