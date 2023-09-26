const supertest = require('supertest');

const app = require('../src/app');
const seed = require('../scripts/seedDb');

describe('Test Admin', () => {
    let request;

    const profileId = 1;

    beforeAll(async () => {
        await seed();
    });

    beforeEach(() => {
        request = supertest.agent(app).set({ 'profile_id': profileId });
    });

    describe('GET /admin/best-profession', () => {
        it('should return the best profession within a given time period', async () => {
            const res = await request.get('/admin/best-profession?start=2020-08-10&end=2020-08-30').send();

            expect(res.statusCode).toEqual(200);
            expect(res.body.profession).toEqual('Programmer');
        });
    });

    describe('GET /admin/best-clients', () => {
        let bestClients = [];
        const baseUrl = '/admin/best-clients?start=2020-08-10&end=2020-08-30';

        beforeAll(async () => {
            const res = await request.get(`${baseUrl}&limit=10`).send();
            bestClients = res.body;
        });

        it('should return only 2 clients when no limit parameter is provided', async () => {
            const res = await request.get(baseUrl).send();

            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(bestClients.slice(0, 2));
        });
    
        it('should return the best N clients within a time range where N is equals to limit', async () => {
            const limit = 4;
            const res = await request.get(`${baseUrl}&limit=${limit}`).send();

            expect(res.body.length).toEqual(limit);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(bestClients.slice(0, limit));
        });
    });
});