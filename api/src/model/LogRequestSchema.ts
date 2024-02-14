import mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const LogRequestSchema = new Schema({
    name: {
        type: String,
        required: 'Name required'
    },

    date: {
        type: Date,
        required: 'Date required'
    },

    status: {
        type: String,
        required: 'status required'
    },

    request: {
        type: String,
    },

    response: {
        type: String,
    },

    matches: {
        type: String,
    }
});
