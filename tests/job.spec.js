const supertest = require('supertest');

const app = require('../src/app');
const seed = require('../scripts/seedDb');

describe('Jobs test suite', () => {
    let request;

    const profileId = 1;

    beforeAll(async () => {
        await seed();
    });

    beforeEach(() => {
        request = supertest.agent(app).set({ 'profile_id': profileId })
    });

    describe('GET /jobs/unpaid', () => {
        it('should return all active unpaid jobs', async () => {
            const res = await request.get('/jobs/unpaid').send();
            const allInProgress = res.body.every(x => { 
                return x.Contract.status === 'in_progress'
            });

            expect(res.statusCode).toEqual(200);
            expect(allInProgress).toEqual(true);
            expect(res.body).toMatchObject([]);
        })
    })

    describe('POST /jobs/:job_id/pay', () => {
        it('should return 404 Not found status code when job does not exist', async () => {
            const res = await request.post('/jobs/0/pay').send();

            expect(res.statusCode).toEqual(404);
            expect(res._body.error).toEqual('Job not found');
        });

        it('should return 404 when the user does not have enough funds to pay the job', async () => {
            const res = await request.post('/jobs/5/pay').set('profile_id', '4').send();

            expect(res.statusCode).toEqual(500);
            expect(res._body.error).toEqual('Insufficient balance');
        });

        it('should return 500 error code when the job is already paid', async () => {
            const res = await request.post('/jobs/14/pay').send();

            expect(res.statusCode).toEqual(500);
            expect(res._body.error).toEqual('Job is already paid');
        });

        it('should pay a job', async () => {
            const res = await request.post('/jobs/2/pay').send();

            expect(res.statusCode).toEqual(200);
        });
    })
})