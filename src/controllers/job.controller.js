
const { Op, Transaction } = require('sequelize');
const { sequelize, Job, Profile, Contract } = require('../model');

const getUnpaidJobs = async (req, res, next) => {
    try {
        const profile = req.profile;

        const jobs = await Job.findAll({
            include: [
                {
                    model: Contract,
                    required: true,
                    include: [{
                        model: Profile,
                        as: 'Contractor',
                        attributes: ['id', 'firstName', 'lastName']
                    }, {
                        model: Profile,
                        as: 'Client',
                        attributes: ['id', 'firstName', 'lastName']
                    }],
                    where: {
                        status: {
                            [Op.in]: ['new', 'in_progress']
                        },
                        [Op.or]: [
                            { ContractorId: profile.id },
                            { ClientId: profile.id }
                        ],
                    }
                }
            ],
            where: { paid: false }
        });

        res.json(jobs);
    } catch (err) {
        return next(err);
    }
};

const payForJob = async (req, res, next) => {
    const { job_id } = req.params;

    const transaction = await sequelize.transaction();

    try {
        const job = await Job.findOne({
            where: { id: job_id },
            include: {
                model: Contract,
                as: 'Contract',
                include: [
                    { model: Profile, as: 'Client' },
                    { model: Profile, as: 'Contractor' },
                ],
            },
            transaction: transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!job) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.paid) {
            await transaction.rollback();
            return res.status(500).json({ error: 'Job is already paid' });
        }

        const client = job.Contract.Client;
        const contractor = job.Contract.Contractor;

        if (!client || !contractor) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Client or Contractor not found' });
        }

        if (client.balance < job.price) {
            await transaction.rollback();
            return res.status(500).json({ error: 'Insufficient balance' });
        }

        client.balance -= job.price;
        contractor.balance += job.price;

        job.paid = true;
        job.paymentDate = new Date();

        await Promise.all([
            client.save({ transaction }),
            contractor.save({ transaction }),
            job.save({ transaction })
        ]);

        await transaction.commit();

        res.json(job);
    } catch (err) {
        await transaction.rollback();
        next(err);
    }
};

module.exports = {
    getUnpaidJobs,
    payForJob
};
