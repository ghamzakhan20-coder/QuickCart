import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, reguired:true },
    name: { type: String, reguired:true },
    email: { type: String, reguired:true, unique:true },
    imageUrl: { type: String, reguired:true },
    cartItem: { type: Object, default: {} }
}, { minimize: false })

const User = mongoose.models.user || mongoose.model('user', userSchema)

export default User