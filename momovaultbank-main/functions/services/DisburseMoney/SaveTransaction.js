const Transaction = require('../../models/Transaction');

// Save the transaction to the database
exports.saveTransaction = async function (transactionData, userId) {
    try {
        // Clean the phone number to remove non-numeric characters.
        if (transactionData.phoneNumber) {
            const cleanedPhoneNumber = transactionData.phoneNumber.replace(/\D/g, '');
            transactionData.phoneNumber = Number(cleanedPhoneNumber);
        }
        const newTransaction = new Transaction({ ...transactionData, userId });
        await newTransaction.save();
        console.log('Transaction saved successfully:', newTransaction);
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
};


exports.deleteTransaction = async function (req, res) {
    try {
        const { id } = req.params;  // changed from transactionId to id

        // Check if transaction exists
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Check if the user owns this transaction
        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to delete this transaction' });
        }

        // Delete the transaction
        await Transaction.findByIdAndDelete(id);
        res.status(200).json({ message: 'Transaction deleted successfully' });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal server error while deleting transaction' });
    }
};
