const { sequelize, Job, Profile, Contract } = require('../model');

const depositToClient = async (req, res, next) => {
    const { userId } = req.params;
    const { amount } = req.body;

    const transaction = await sequelize.transaction();

    try {
        if (!parseFloat(amount)) {
            await transaction.rollback();
            return res.status(500).json({ error: 'Invalid amount' });
        }

        const client = await Profile.findOne({
            where: {
                id: userId,
                type: 'client'
            },
            transaction: transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!client) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Client not found' });
        }

        const totalJobsToPay = await Job.sum('price', {
            include: [{
                model: Contract,
                required: true,
                where: { ClientId: client.id }
            }],
            where: { paid: false },
            transaction
        });

        const maxDepositAmount = totalJobsToPay * 0.25;

        if (amount > maxDepositAmount) {
            await transaction.rollback();
            return res.status(500).json({ error: "You can't deposit more than 25% of your total jobs to pay" });
        }

        if (client.type !== 'client') {
            await transaction.rollback();
            return res.status(500).json({ error: 'Only client can receive deposit' });
        }

        client.balance += amount;
        await client.save({ transaction });

        await transaction.commit();

        res.json({
            balance: client.balance,
            totalJobsToPay
        });
    } catch (err) {
        await transaction.rollback();
        next(err);
    }
};

module.exports = {
    depositToClient
};
