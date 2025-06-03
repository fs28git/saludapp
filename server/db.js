const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://cluster0.plvtpgk.mongodb.net/saludapp', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB conectado');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
    }
};

module.exports = connectDB;