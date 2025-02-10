const mongoose = require('mongoose');

const swearJarSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    members: [{
        name: { type: String, required: true },
        amount: { type: Number, default: 0 }
    }],
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
});

module.exports = mongoose.model('SwearJar', swearJarSchema);
