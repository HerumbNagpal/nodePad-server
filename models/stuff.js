const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const stuffSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    notes: [
        {
            title: String,
            content: String,
        },
    ],
    todos: [
        {
            task: String,
            completed: Boolean,
        },
    ],
},{
    // collection : 'users'
})

const Stuff = mongoose.model("Stuff", stuffSchema )

module.exports = Stuff