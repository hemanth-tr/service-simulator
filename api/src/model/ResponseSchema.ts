import mongoose from 'mongoose';

const Schema = mongoose.Schema;


export const ResponseSchema = new Schema({
    name: {
        type: String,
        required: 'Name required'
    },

    response: {
        type: String
    },
});