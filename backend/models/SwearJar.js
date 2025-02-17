const mongoose = require('mongoose');

const swearJarSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{
        name: { type: String, required: true },
        amount: { type: Number, default: 0 }
    }],
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    permissions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        canEdit: { type: Boolean, default: false }
    }]
});

module.exports = mongoose.model('SwearJar', swearJarSchema);
