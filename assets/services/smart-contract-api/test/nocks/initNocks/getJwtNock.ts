import nock from 'nock';
import { AUTH0_URL } from 'src/config/constants';

export function getJwtTokenNock() {
  nock(AUTH0_URL)
    .post('/oauth/token')
    .reply(200, { access_token: 'fakeJWT_token' });
}
