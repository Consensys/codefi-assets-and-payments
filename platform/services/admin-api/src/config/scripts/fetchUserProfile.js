function(accessToken, ctx, cb) {
    const request = require('request');
    let profile = {};
    // Call OAuth2 API with the accessToken and create the profile
  
    const infuraApiUrl = '%INFURA_USER_API_URL%';
  
    request({
      method: 'GET',
      url: infuraApiUrl,
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }, function (err, resp, body) {
  
      if (err) {
        return cb(new Error(`Error response from Infura API. ${err}`));
      }
  
      if (resp.statusCode !== 200) {
        return cb(new Error(`Response status code is ${resp.statusCode} from Infura API`));
      }
  
      if (!resp.body) {
        return cb(new Error(`Missing 'body' field in response from Infura API (${infuraApiUrl}).`));
      }
      
      let parsedResponse
      try {
        parsedResponse = JSON.parse(resp.body)
      } catch (error) {
        return cb(new Error(`Invalid 'body' field in response from Infura API (${infuraApiUrl}), it can't be parsed as a JSON.`));
      }
  
      if (!parsedResponse.result) {
        return cb(new Error(`Missing 'result' field in response body from Infura API (${infuraApiUrl}).`));
      }
  
      if (!parsedResponse.result.user) {
        return cb(new Error(`Missing 'user' field in response body result from Infura API (${infuraApiUrl}).`));
      }
  
      const user = parsedResponse.result.user;
  
      profile = {
        user_id: user.id,
        given_name: `Infura`,
        family_name: 'Infura',
        email: user.email
      };
      cb(null, profile);
    });
  
  }
  