const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();

app.use(bodyParser.json());

const WEATHER_API_URL = 'http://api.openweathermap.org/data/2.5';

app.post('/weather', function(req, res) {
  console.log('[GET] /weather');
  const location = req.body.conversation.memory.location;

  return axios
    .get(`${WEATHER_API_URL}/weather`, {
      params: {
        lat: Math.round(location.lat),
        lon: Math.round(location.lng),
        appid: config.OPENWEATHER_TOKEN,
      },
    })
    .then(function(response) {
      const body = response.data;
      if (!body || !body.weather || body.weather.length === 0) {
        return res.json({
          replies: [
            {
              type: 'text',
              content:
                "I couldn't find any results for this location, could you try again?",
            },
          ],
        });
      }

      let mainWeather = body.weather[0].main;
      if (mainWeather === 'Clear') {
        // Isn't it more an appealing name?
        mainWeather = 'Sun';
      }
      const temperature = kelvinToCelcius(body.main.temp);
      // Resetting location memory now that we've used it
      delete req.body.conversation.memory.location;

      return res.json({
        replies: [
          {
            type: 'text',
            content: `We're expecting ${mainWeather.toLowerCase()} in ${location.formatted} today, with a ${tempToAdjective(
              temperature
            )} ${temperature}°C ${weatherToEmoji(mainWeather)}`,
          },
        ],
        conversation: { memory: req.body.conversation.memory },
      });
    })
    .catch(function(err) {
      console.error('weatherBot::weather error: ', err);
    });
});

const port = config.PORT;
app.listen(port, function() {
  console.log(`App is listening on port ${port}`);
});

function kelvinToCelcius(temp) {
  return Math.round(temp - 273.15);
}

// Returns an adjective depending on today's temperature
function tempToAdjective(temp) {
  if (temp < 10) {
    return 'refreshing';
  } else if (temp < 20) {
    return 'lukewarm';
  } else if (temp < 30) {
    return 'warm';
  } else {
    return 'hot';
  }
}

// Returns an emoji corresponding to today's mood
function weatherToEmoji(weather) {
  switch (weather.toLowerCase()) {
    case 'sun':
      return '☀️';
    case 'clouds':
      return '☁️';
    case 'mist':
    case 'fog':
      return '🌫';
    case 'thunderstorm':
      return '⚡️';
    case 'drizzle':
    case 'rain':
      return '☔️';
    case 'snow':
      return '❄️';
    default:
      return '';
  }
}
