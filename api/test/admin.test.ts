import * as chai from 'chai'
import chaiHttp = require('chai-http')

import app from '../src/App'

chai.use(chaiHttp)
const expect = chai.expect

describe('GET api/v1/admin/services', () => {
  it('responds with JSON array', () => {
    return chai.request(app).get('/api/v1/admin/services')
      .then(res => {
        expect(res.status).to.equal(200)
        expect(res).to.be.json
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.length(6)
      })
  })

  it('should include service1', () => {
    return chai.request(app).get('/api/v1/admin/services')
      .then(res => {
        let serivce1 = res.body.find(service => service.name === 'service1')
        expect(serivce1).to.exist
      })
  })

})

describe('GET api/v1/admin/services/:name', () => {

  it('responds with single JSON object', () => {
    return chai.request(app).get('/api/v1/admin/services/service1')
      .then(res => {
        expect(res.status).to.equal(200)
        expect(res).to.be.json
        expect(res.body).to.be.an('object')
      })
  })

  it('should return service1', () => {
    return chai.request(app).get('/api/v1/admin/services/service1')
      .then(res => {
        expect(res.body.name).to.equal('service1');
      })
  })

  it('should have service url', () => {
    return chai.request(app).get('/api/v1/admin/services')
      .then(res => {
        expect(res.status).to.equal(200)
        expect(res).to.be.json
        expect(res.body).to.be.an('array')
        let serivce1 = res.body.find(service => service.name === 'service1')
        expect(serivce1).to.exist
        expect(serivce1.url).to.be.contain('/service1')
      })
  })

  it('should return 404 for not available service', () => {
    return chai.request(app).get('/api/v1/admin/services/na')
      .catch(err => {
        expect(err.status).to.equal(404)
      })
  })
})

describe('GET api/v1/admin/services/:name/maps/:mapName', () => {

  it('responds with map details', () => {
    return chai.request(app).get('/api/v1/admin/services/service1/maps/request_1')
      .then(res => {
        expect(res.status).to.equal(200)
        expect(res).to.be.json
        let map = res.body
        expect(map.name).to.equal('request_1')
        expect(map.request).to.equal('request_1 here')
        expect(map.response).to.equal('<xml>service1_response_1</xml>')
        expect(map.matches).to.not.be.undefined
        expect(map.matches.length).to.equal(1)
        expect(map.matches[0]).to.equal('request_1')
      })
  })
})

describe('POST api/v1/admin/services/:name/test', () => {
  it('responds with post data', () => {
    return chai.request(app).post('/api/v1/admin/services/service1/test').send(' this is request_1 data')
      .then(res => {
        expect(res.status).to.equal(200)
        expect(res).to.be.json
        let resp = res.body
        expect(resp.status).to.equal(200)
        expect(resp.response).to.equal('<xml>service1_response_1</xml>')
        expect(resp.matches).to.not.be.undefined
        expect(resp.matches.length).to.equal(1)
        expect(resp.matches[0]).to.equal('request_1')
      })
  })
})


describe('Adding new test case', () => {
  it('responds with 200 and adds new response', () => {
    var mapName = 'request_' + Math.floor(Math.random() * 10000) + 1
    console.log(mapName)
    var newRequest = {
      name: mapName,
      request: 'request for ' + mapName + ' here',
      response: 'response for ' + mapName + ' here',
      matches: [mapName]
    }
    return chai.request(app).post('/api/v1/admin/services/service1/maps').send(newRequest)
      .then(res => {
        expect(res.status).to.equal(200);

        return chai.request(app).get('/api/v1/admin/services/service1/maps/' + mapName)
          .then(res => {
            expect(res.status).to.equal(200)
            expect(res).to.be.json
            let map = res.body
            expect(map.name).to.equal(newRequest.name)
            expect(map.request).to.equal(newRequest.request)
            expect(map.response).to.equal(newRequest.response)
            expect(map.matches).to.not.be.undefined
            expect(map.matches.length).to.equal(1)
            expect(map.matches[0]).to.equal(mapName)
          })
      });
  });
});

describe('Editing test case', () => {
  it('responds with 200 and modified response', () => {
    var mapName = 'request_' + Math.floor(Math.random() * 10000) + 1
    console.log(mapName)
    var newRequest = {
      name: mapName,
      request: 'request for ' + mapName + ' here',
      response: 'response for ' + mapName + ' here',
      matches: [mapName]
    }
    return chai.request(app).post('/api/v1/admin/services/service1/maps').send(newRequest)
      .then(res => {
        expect(res.status).to.equal(200);

        return chai.request(app).get('/api/v1/admin/services/service1/maps/' + mapName)
          .then(res => {
            expect(res.status).to.equal(200)
            expect(res).to.be.json
            let map = res.body
            expect(map.name).to.equal(newRequest.name)
            expect(map.request).to.equal(newRequest.request)
            expect(map.response).to.equal(newRequest.response)
            expect(map.matches).to.not.be.undefined
            expect(map.matches.length).to.equal(1)
            expect(map.matches[0]).to.equal(mapName)

            newRequest.request = newRequest.request + 'modified'
            newRequest.response = newRequest.response + 'modified'

            var modifiedRequest = {
              name: newRequest.name,
              request: newRequest.request + 'modified',
              response: newRequest.response + 'modified',
              matches: [mapName]
            }

            // get current number maps
            return chai.request(app).get('/api/v1/admin/services/service1')
              .then(res => {
                let service = res.body
                let prevMapCount = service.config.length
                console.log('prevMapCount:' + prevMapCount)

                return chai.request(app).patch('/api/v1/admin/services/service1/maps').send(modifiedRequest)
                  .then(res => {

                    expect(res.status).to.equal(200)
                    expect(res).to.be.json
                    let map = res.body
                    return chai.request(app).get('/api/v1/admin/services/service1/maps/' + mapName)
                      .then(res => {
                        let map = res.body
                        expect(map.name).to.equal(modifiedRequest.name)
                        expect(map.request).to.equal(modifiedRequest.request)
                        expect(map.response).to.equal(modifiedRequest.response)
                        expect(map.matches).to.not.be.undefined
                        expect(map.matches.length).to.equal(1)
                        expect(map.matches[0]).to.equal(mapName)

                        // map count should be same
                        return chai.request(app).get('/api/v1/admin/services/service1')
                          .then(res => {
                            let service = res.body
                            let currentMapCount = service.config.length
                            console.log('currentMapCount:' + currentMapCount)
                            console.log('prevMapCount:' + prevMapCount)
                            expect(currentMapCount).to.be.equal(prevMapCount)
                          })
                      })
                  })
              })

          })
      });
  });
});
