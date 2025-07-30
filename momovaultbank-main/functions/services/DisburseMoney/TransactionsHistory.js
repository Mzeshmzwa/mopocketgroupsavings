const Transaction = require('../../models/Transaction');

// Function to get all transactions for the authenticated user
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).populate('employee');
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
};
