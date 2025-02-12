const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionsSchema = new Schema({
  swearJarId: {
    type: Schema.Types.ObjectId,
    ref: 'SwearJar',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now  // Automatically set the current timestamp
  },
  userId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['name added', 'name removed', 'amount added', 'amount removed', 'other']
  },
  details: {
    name: String,
    amount: Number
  }
});

module.exports = mongoose.model('Transactions', TransactionsSchema);
