import mongoose from 'mongoose';

const Schema = mongoose.Schema;


export const RequestSchema = new Schema({
    name: {
        type: String,
        required: 'Name required'
    },

    request: {
        type: String
    },
});