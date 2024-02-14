import mongoose from 'mongoose';

const Schema = mongoose.Schema;


export const ServiceSchema = new Schema({
    name: {
        type: String,
        required: 'Name required',
        index: {
            unique: true,
            dropDups: true
        }

    },

    config: [{
        name: {
            type: String,
            required: 'Config.name required'
        },

        matches: [
            {
                type: String
            }
        ]
    }
    ]
});