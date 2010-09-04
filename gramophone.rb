require 'sinatra'
require 'httparty'
require 'hpricot'
require 'json'
require 'net/http'
require 'uri'

class Gramophone < Sinatra::Base
  ROOT = File.expand_path(File.dirname(__FILE__))
  
  SEVEN_DIGITAL = 'http://api.7digital.com/1.2/'
  OAUTH_KEY = 'musichackday'
  
  set :public, ROOT + '/public'
  set :views,  ROOT + '/views'
  set :static, true
  
  get '/' do
    erb :index
  end
  
  get '/mp3' do
    doc   = xml_from_7digital('track/search', :q => params[:title])
    track = (doc / 'track').first
    url   = "#{SEVEN_DIGITAL}track/preview?oauth_consumer_key=#{OAUTH_KEY}&country=GB&trackid=#{track[:id]}"
    JSON.unparse('url' => redirect_target(url))
  end
  
  helpers do
    def xml_from_7digital(method, params)
      xml = HTTParty.get(SEVEN_DIGITAL + method, :query => params.merge(
                          :oauth_consumer_key => OAUTH_KEY,
                          :country => 'GB'
                        ))
      Hpricot.parse(xml.body)
    end
    
    def redirect_target(url)
      response = Net::HTTP.get_response(URI.parse(url))
      Net::HTTPRedirection === response ?
          redirect_target(response['location']) :
          response.body.strip == '' ? nil : url
    end
  end
end

