const supertest = require('supertest');

const app = require('../src/app');
const seed  = require('../scripts/seedDb');

describe('Balances test suite', () => {
    let request;

    const profileId = 1;

    beforeAll(async () => {
        await seed();
    });

    beforeEach(() => {
        request = supertest.agent(app).set({ 'profile_id': profileId  });
    });

    describe('/balances/deposit/:userId', () => {
        it('should not accept deposit if the amount is more than 25% of the total jobs to pay', async () => {
            const toId = 2;
            const amount = 60000;
            const res = await request.post(`/balances/deposit/${toId}`).send({amount});

            expect(res.statusCode).toEqual(500);
            
            console.log(res);
            expect(res._body.error).toEqual("You can't deposit more than 25% of your total jobs to pay");
        });

        it('should not allow deposits from users who are not clients', async () => {
            const toId = 2;
            const amount = 2;

            request = supertest.agent(app).set({ 'profile_id': '5' });

            const res = await request.post(`/balances/deposit/${toId}`).send({amount});

            expect(res.statusCode).toEqual(500);
        });

        it('should not allow deposit if amount is not a number', async () => {
            const toId = 1;
            const amount = 'abcd12';
            const res = await request.post(`/balances/deposit/${toId}`).send({amount});

            expect(res.statusCode).toEqual(500);
            expect(res._body.error).toEqual('Invalid amount');
        });
  })
})