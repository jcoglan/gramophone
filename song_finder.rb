# Special secret supporting web service, to be run
# on Songkick's web-scale MongoDB infrastructures.

module Gramophone
  class SongFinder
    
    def call(env)
      params = Rack::Request.new(env).params
      
      venues = Venue.find(:all, :conditions => [
                                'glat > ? and glat < ? and glng > ? and glng < ?',
                                params['min_lat'], params['max_lat'],
                                params['min_lng'], params['max_lng']
                         ])
      
      start_date = Date.new(params['year'].to_i, params['month'].to_i, 1)
      end_date   = start_date.end_of_month
      
      events = venues.inject([]) do |list, venue|
        list + venue.events.find(:all, :conditions => [
                                       'date >= ? and date <= ?',
                                       start_date.strftime('%Y%m%d'),
                                       end_date.strftime('%Y%m%d')
                                ])
      end
      
      setlist_items = events.inject([]) do |list, event|
        event.performances.each do |performance|
          next unless setlist = performance.setlist
          setlist.setlist_items.each do |item|
            item_data = {
              :artist => performance.artist.name,
              :song   => item.name,
              :venue  => event.venue.name,
              :lat    => event.venue.glat.to_f,
              :lng    => event.venue.glng.to_f
            }
            begin
              JSON.unparse(item_data)
              list << item_data
            rescue
            end
          end
        end
        list
      end
      
      response = params['jsonp'] + '(' + JSON.unparse(setlist_items) + ');'
      [200, {'Content-type' => 'text/javascript'}, [response]]
    end
    
  end
end

puts "Booting ..."
Rack::Handler.get('mongrel').run(Gramophone::SongFinder.new, :Port => 3001)

