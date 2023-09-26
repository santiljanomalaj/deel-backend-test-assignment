const { Op } = require('sequelize');
const { sequelize, Job, Profile, Contract } = require('../model');

const getBestProfession = async (req, res, next) => {
    const { start, end } = req.query;

    try {
        const bestProfession = await Job.findAll({
            where: {
                paid: true,
                paymentDate: {
                    [Op.between]: [new Date(start), new Date(end)]
                }
            },
            include: {
                model: Contract,
                include: {
                    model: Profile,
                    as: 'Contractor',
                    attributes: ['profession']
                },
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('price')), 'total_earned'],
                [sequelize.col('Contract.Contractor.profession'), 'profession']
            ],
            group: ['Contract.Contractor.profession'],
            order: [[sequelize.fn('SUM', sequelize.col('price')), 'DESC']],
            limit: 1
        });

        if (bestProfession.length === 0) {
            return res.status(404).json({ error: 'Best profession not found' });
        }

        res.json(bestProfession[0]);
    } catch (err) {
        return next(err);
    }
};

const getBestClients = async (req, res, next) => {
    const { start, end } = req.query;
    const limit = parseInt(req.query.limit) || 2;

    try {
        const jobs = await Job.findAll({
            attributes: [
                [sequelize.literal('`Contract`.`ClientId`'), 'id'],
                [sequelize.literal("`Contract->Client`.`firstName` || ' ' || `Contract->Client`.`lastName`"), 'fullName'],
                [sequelize.fn('sum', sequelize.col('price')), 'totalPaid']
            ],
            include: [{
                model: Contract,
                as: 'Contract',
                attributes: [],
                include: [{
                    model: Profile,
                    as: 'Client',
                    attributes: [],
                }]
            }],
            where: {
                paymentDate: {
                    [Op.between]: [start, end]
                },
                paid: true
            },
            group: ['Contract.ClientId', sequelize.literal("`Contract->Client`.`firstName` || ' ' || `Contract->Client`.`lastName`")],
            order: sequelize.literal('totalPaid DESC'),
            limit: limit
        });

        const result = jobs.map(job => ({
            id: job.get('id'),
            fullName: job.get('fullName'),
            paid: parseFloat(job.get('totalPaid'))
        }));

        res.json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBestProfession,
    getBestClients
};
