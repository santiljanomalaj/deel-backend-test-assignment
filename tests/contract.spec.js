const supertest = require('supertest');

const app = require('../src/app');
const seed = require('../scripts/seedDb');

describe('Test Contract', () => {
    let request;

    const profileId = 1;

    beforeAll(async () => {
        await seed();
    });

    beforeEach(() => {
        request = supertest.agent(app).set({ 'profile_id': profileId })
    });

    describe('GET /contracts', () => {
        it('should return all the contracts that belong to the user and are active', async () => {
            const res = await request.get('/contracts').send();
            
            const belongs = res.body.every(x => profileId === x.ClientId || profileId === x.ContractorId);
            const allActive = res.body.every(x => x.status === 'in_progress');

            expect(res.statusCode).toEqual(200);
            expect(belongs).toBe(true);
            expect(allActive).toBe(true);
            expect(res.body).toMatchObject([{
                id: 2,
                terms: 'bla bla bla',
                status: 'in_progress',
                ContractorId: 6,
                ClientId: 1
            }]);
        });
    });

    describe('GET /contracts/:id', () => {
        it('should return a status 404 Not Found when the contract does not exist', async () => {
            const res = await request.get('/contracts/0').send();

            expect(res.statusCode).toEqual(404);
            expect(res._body.error).toEqual('Contract not found');
        });

        it('should return a contract when it belongs to the current user', async () => {
            const res = await request.get('/contracts/2').send();
            const belongs = (profileId === res.body.ClientId || profileId === res.body.ContractorId);

            expect(res.statusCode).toEqual(200);
            expect(belongs).toEqual(true);
            expect(res.body).toMatchObject({
                id: 2,
                terms: 'bla bla bla',
                status: 'in_progress',
                ContractorId: 6,
                ClientId: 1
            });
        });
    });
})